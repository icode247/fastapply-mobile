// Automation Service - Production-ready automation management
// Handles creating automations and adding URLs with retry logic and local state

import { ENDPOINTS } from "../constants/api";
import {
  AddUrlsDto,
  AddUrlsResponse,
  Automation,
  AutomationListResponse,
  AutomationQueueStats,
  AutomationRun,
  AutomationRunsResponse,
  AutomationStats,
  AutomationUrl,
  CreateAutomationDto,
  RescheduleUrlDto,
  UpdateAutomationDto,
  UrlInput,
  UrlListResponse,
  UrlStatus,
} from "../types/automation.types";
import { storage } from "../utils/storage";
import api, { getApiErrorMessage, isApiError } from "./api";

// Local storage keys
const STORAGE_KEYS = {
  PROFILE_AUTOMATION_MAP: "automation_profile_map",
  PENDING_URLS: "automation_pending_urls",
  LAST_SYNC: "automation_last_sync",
} as const;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // ms
  maxDelay: 10000, // ms
  backoffMultiplier: 2,
} as const;

// Types for local state
interface ProfileAutomationMap {
  [profileId: string]: string; // profileId -> automationId
}

interface PendingUrlEntry {
  profileId: string;
  profileName?: string;
  url: UrlInput;
  timestamp: number;
  retryCount: number;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  const delay =
    RETRY_CONFIG.baseDelay *
    Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Automation Service - Singleton for managing job application automations
 */
class AutomationService {
  private profileAutomationMap: ProfileAutomationMap = {};
  private pendingUrls: PendingUrlEntry[] = [];
  private isProcessingQueue = false;
  private initialized = false;

  /**
   * Initialize service by loading cached state
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load cached profile-automation mappings
      const cachedMap = await storage.getItem(STORAGE_KEYS.PROFILE_AUTOMATION_MAP);
      if (cachedMap) {
        this.profileAutomationMap = JSON.parse(cachedMap);
      }

      // Load pending URLs that weren't synced
      const cachedPending = await storage.getItem(STORAGE_KEYS.PENDING_URLS);
      if (cachedPending) {
        this.pendingUrls = JSON.parse(cachedPending);
      }

      this.initialized = true;

      // Process any pending URLs in background
      if (this.pendingUrls.length > 0) {
        this.processPendingUrlsQueue();
      }
    } catch (error) {
      console.error("Failed to initialize automation service:", error);
      // Continue without cached state
      this.initialized = true;
    }
  }

  /**
   * Save state to local storage
   */
  private async saveState(): Promise<void> {
    try {
      await Promise.all([
        storage.setItem(
          STORAGE_KEYS.PROFILE_AUTOMATION_MAP,
          JSON.stringify(this.profileAutomationMap)
        ),
        storage.setItem(
          STORAGE_KEYS.PENDING_URLS,
          JSON.stringify(this.pendingUrls)
        ),
        storage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
      ]);
    } catch (error) {
      console.error("Failed to save automation state:", error);
    }
  }

  /**
   * Get existing automation for a profile (does not create)
   */
  async getAutomationForProfile(
    profileId: string
  ): Promise<Automation | null> {
    await this.initialize();

    // Check cache first
    const cachedAutomationId = this.profileAutomationMap[profileId];
    if (cachedAutomationId) {
      try {
        const automation = await this.getAutomation(cachedAutomationId);
        if (automation) return automation;
      } catch {
        // Cached automation might be deleted, continue to search
        delete this.profileAutomationMap[profileId];
      }
    }

    // Search for existing direct_urls automation for this profile
    try {
      const existingAutomations = await this.listAutomations({
        applicationMode: "direct_urls",
        isActive: true,
        limit: 100,
      });

      const profileAutomation = existingAutomations.data.find(
        (a) => a.jobProfileId === profileId && a.applicationMode === "direct_urls"
      );

      if (profileAutomation) {
        this.profileAutomationMap[profileId] = profileAutomation.id;
        await this.saveState();
        return profileAutomation;
      }
    } catch (error) {
      console.warn("Failed to search existing automations:", error);
    }

    return null;
  }

  /**
   * Clean up cached data for invalid profiles
   * Call this when valid profile IDs are known (after fetching from backend)
   */
  async cleanupInvalidProfiles(validProfileIds: string[]): Promise<void> {
    await this.initialize();

    const validSet = new Set(validProfileIds);
    let changed = false;

    // Remove pending URLs for invalid profiles
    const validPendingUrls = this.pendingUrls.filter((entry) => {
      if (!validSet.has(entry.profileId)) {
        console.log(
          `Removing cached pending URL for invalid profile: ${entry.profileId}`
        );
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) {
      this.pendingUrls = validPendingUrls;
    }

    // Remove profile automation mappings for invalid profiles
    for (const profileId of Object.keys(this.profileAutomationMap)) {
      if (!validSet.has(profileId)) {
        console.log(
          `Removing cached automation mapping for invalid profile: ${profileId}`
        );
        delete this.profileAutomationMap[profileId];
        changed = true;
      }
    }

    if (changed) {
      await this.saveState();
    }
  }

  /**
   * Create automation for a profile with initial URL
   * Backend requires at least 1 URL for direct_urls mode
   */
  async createAutomationForProfile(
    profileId: string,
    initialUrl: string,
    profileName?: string
  ): Promise<Automation | null> {
    const automationName = profileName
      ? `${profileName} - Mobile Swipe Queue`
      : `Mobile Swipe Queue - ${new Date().toLocaleDateString()}`;

    const newAutomation = await this.createAutomation({
      name: automationName,
      jobProfileId: profileId,
      applicationMode: "direct_urls",
      scheduleType: "daily",
      scheduleConfig: {
        time: "09:00", // Default to 9 AM
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      isActive: true,
      maxApplicationsPerDay: 50,
      jobUrls: [initialUrl], // Must have at least 1 URL
    });

    if (newAutomation) {
      this.profileAutomationMap[profileId] = newAutomation.id;
      await this.saveState();
    }

    return newAutomation;
  }

  /**
   * Add a job URL to the automation queue
   * This is called on swipe right (apply)
   */
  async addJobToQueue(
    profileId: string,
    jobUrl: string,
    jobDetails?: {
      title?: string;
      company?: string;
      platform?: string;
    },
    profileName?: string
  ): Promise<{ success: boolean; error?: string; automationId?: string }> {
    await this.initialize();

    const urlInput: UrlInput = {
      url: jobUrl,
      jobTitle: jobDetails?.title,
      company: jobDetails?.company,
      platform: jobDetails?.platform || this.detectPlatform(jobUrl),
    };

    // Add to pending queue first (optimistic update)
    const pendingEntry: PendingUrlEntry = {
      profileId,
      profileName,
      url: urlInput,
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.pendingUrls.push(pendingEntry);
    await this.saveState();

    try {
      // Check if automation exists for this profile
      let automation = await this.getAutomationForProfile(profileId);

      if (!automation) {
        // Create automation with this URL as the initial URL
        // Backend requires at least 1 URL for direct_urls mode
        automation = await this.createAutomationForProfile(
          profileId,
          jobUrl,
          profileName
        );

        if (!automation) {
          return {
            success: false,
            error: "Failed to create automation. Please try again.",
          };
        }

        // URL was included in creation, remove from pending
        this.pendingUrls = this.pendingUrls.filter(
          (p) => !(p.profileId === profileId && p.url.url === jobUrl)
        );
        await this.saveState();

        return {
          success: true,
          automationId: automation.id,
        };
      }

      // Automation exists, add URL to it
      const result = await this.addUrlsWithRetry(automation.id, [urlInput]);

      if (result.success) {
        // Remove from pending queue
        this.pendingUrls = this.pendingUrls.filter(
          (p) => !(p.profileId === profileId && p.url.url === jobUrl)
        );
        await this.saveState();

        return {
          success: true,
          automationId: automation.id,
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to add job to queue",
        };
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      console.error("Failed to add job to queue:", errorMessage);

      // Keep in pending queue for retry
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Add URLs with retry logic
   */
  private async addUrlsWithRetry(
    automationId: string,
    urls: UrlInput[]
  ): Promise<{ success: boolean; error?: string; data?: AddUrlsResponse }> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const response = await api.post<AddUrlsResponse>(
          ENDPOINTS.AUTOMATIONS.URLS(automationId),
          { urls }
        );
        return { success: true, data: response.data };
      } catch (error) {
        lastError = getApiErrorMessage(error);

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (isApiError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            return { success: false, error: lastError };
          }
        }

        // Wait before retry
        if (attempt < RETRY_CONFIG.maxRetries - 1) {
          await sleep(getRetryDelay(attempt));
        }
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Process pending URLs queue in background
   */
  private async processPendingUrlsQueue(): Promise<void> {
    if (this.isProcessingQueue || this.pendingUrls.length === 0) return;

    this.isProcessingQueue = true;

    try {
      const urlsToProcess = [...this.pendingUrls];

      for (const entry of urlsToProcess) {
        // Skip if too many retries
        if (entry.retryCount >= RETRY_CONFIG.maxRetries) {
          this.pendingUrls = this.pendingUrls.filter(
            (p) => p !== entry
          );
          continue;
        }

        try {
          // First try to get existing automation
          let automation = await this.getAutomationForProfile(entry.profileId);

          if (!automation) {
            // Create automation with this URL
            automation = await this.createAutomationForProfile(
              entry.profileId,
              entry.url.url,
              entry.profileName
            );
          }

          if (automation) {
            // If automation was just created with this URL, it's already added
            // Otherwise add the URL to existing automation
            const result = await this.addUrlsWithRetry(automation.id, [
              entry.url,
            ]);

            if (result.success) {
              // Remove from queue
              this.pendingUrls = this.pendingUrls.filter(
                (p) => p !== entry
              );
            } else {
              // Increment retry count
              entry.retryCount++;
            }
          }
        } catch (error) {
          entry.retryCount++;
        }

        // Small delay between processing
        await sleep(500);
      }

      await this.saveState();
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    if (urlLower.includes("greenhouse.io")) return "greenhouse";
    if (urlLower.includes("lever.co")) return "lever";
    if (urlLower.includes("workday.com")) return "workday";
    if (urlLower.includes("linkedin.com")) return "linkedin";
    if (urlLower.includes("indeed.com")) return "indeed";
    if (urlLower.includes("glassdoor.com")) return "glassdoor";
    if (urlLower.includes("ashbyhq.com")) return "ashby";
    if (urlLower.includes("bamboohr.com")) return "bamboohr";
    if (urlLower.includes("jobvite.com")) return "jobvite";
    if (urlLower.includes("smartrecruiters.com")) return "smartrecruiters";
    return "other";
  }

  // ============ Core API Methods ============

  /**
   * Create a new automation
   */
  async createAutomation(
    data: CreateAutomationDto
  ): Promise<Automation | null> {
    try {
      const response = await api.post<Automation>(
        ENDPOINTS.AUTOMATIONS.BASE,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create automation:", getApiErrorMessage(error));
      return null;
    }
  }

  /**
   * Get automation by ID
   */
  async getAutomation(id: string): Promise<Automation | null> {
    try {
      const response = await api.get<Automation>(
        ENDPOINTS.AUTOMATIONS.BY_ID(id)
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get automation:", getApiErrorMessage(error));
      return null;
    }
  }

  /**
   * List automations with filters
   */
  async listAutomations(params?: {
    limit?: number;
    page?: number;
    isActive?: boolean;
    applicationMode?: "platform_search" | "direct_urls";
  }): Promise<AutomationListResponse> {
    try {
      const response = await api.get<AutomationListResponse>(
        ENDPOINTS.AUTOMATIONS.BASE,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to list automations:", getApiErrorMessage(error));
      return { data: [], total: 0, page: 1, limit: 10, hasMore: false };
    }
  }

  /**
   * Update automation
   */
  async updateAutomation(
    id: string,
    data: UpdateAutomationDto
  ): Promise<Automation | null> {
    try {
      const response = await api.patch<Automation>(
        ENDPOINTS.AUTOMATIONS.BY_ID(id),
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update automation:", getApiErrorMessage(error));
      return null;
    }
  }

  /**
   * Delete automation
   */
  async deleteAutomation(id: string): Promise<boolean> {
    try {
      await api.delete(ENDPOINTS.AUTOMATIONS.BY_ID(id));
      // Clean up local cache
      for (const [profileId, automationId] of Object.entries(
        this.profileAutomationMap
      )) {
        if (automationId === id) {
          delete this.profileAutomationMap[profileId];
        }
      }
      await this.saveState();
      return true;
    } catch (error) {
      console.error("Failed to delete automation:", getApiErrorMessage(error));
      return false;
    }
  }

  /**
   * Toggle automation active status
   */
  async toggleAutomation(id: string): Promise<Automation | null> {
    try {
      const response = await api.patch<Automation>(
        ENDPOINTS.AUTOMATIONS.TOGGLE(id)
      );
      return response.data;
    } catch (error) {
      console.error("Failed to toggle automation:", getApiErrorMessage(error));
      return null;
    }
  }

  /**
   * Add URLs to automation
   */
  async addUrls(id: string, data: AddUrlsDto): Promise<AddUrlsResponse | null> {
    try {
      const response = await api.post<AddUrlsResponse>(
        ENDPOINTS.AUTOMATIONS.URLS(id),
        data
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add URLs:", getApiErrorMessage(error));
      return null;
    }
  }

  /**
   * Get URLs for automation
   */
  async getUrls(
    id: string,
    status?: UrlStatus
  ): Promise<UrlListResponse> {
    try {
      const response = await api.get<UrlListResponse>(
        ENDPOINTS.AUTOMATIONS.URLS(id),
        { params: status ? { status } : undefined }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get URLs:", getApiErrorMessage(error));
      return { data: [], total: 0 };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(id: string): Promise<AutomationQueueStats | null> {
    try {
      const response = await api.get<AutomationQueueStats>(
        ENDPOINTS.AUTOMATIONS.QUEUE_STATS(id)
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get queue stats:", getApiErrorMessage(error));
      return null;
    }
  }

  /**
   * Retry failed URLs
   */
  async retryFailedUrls(
    id: string,
    data: RescheduleUrlDto
  ): Promise<boolean> {
    try {
      await api.post(ENDPOINTS.AUTOMATIONS.URLS_RETRY(id), data);
      return true;
    } catch (error) {
      console.error("Failed to retry URLs:", getApiErrorMessage(error));
      return false;
    }
  }

  /**
   * Get automation runs
   */
  async getRuns(
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<AutomationRunsResponse> {
    try {
      const response = await api.get<AutomationRunsResponse>(
        ENDPOINTS.AUTOMATIONS.RUNS(id),
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get runs:", getApiErrorMessage(error));
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  /**
   * Get automation statistics
   */
  async getStats(id: string): Promise<AutomationStats | null> {
    try {
      const response = await api.get<AutomationStats>(
        ENDPOINTS.AUTOMATIONS.STATS(id)
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get stats:", getApiErrorMessage(error));
      return null;
    }
  }

  // ============ Utility Methods ============

  /**
   * Get cached automation ID for a profile
   */
  getAutomationIdForProfile(profileId: string): string | null {
    return this.profileAutomationMap[profileId] || null;
  }

  /**
   * Get pending URLs count
   */
  getPendingUrlsCount(): number {
    return this.pendingUrls.length;
  }

  /**
   * Clear all cached state
   */
  async clearCache(): Promise<void> {
    this.profileAutomationMap = {};
    this.pendingUrls = [];
    this.initialized = false;
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.PROFILE_AUTOMATION_MAP),
      storage.removeItem(STORAGE_KEYS.PENDING_URLS),
      storage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);
  }

  /**
   * Sync pending URLs (manual trigger)
   */
  async syncPendingUrls(): Promise<void> {
    await this.processPendingUrlsQueue();
  }
}

// Export singleton instance
export const automationService = new AutomationService();
export default automationService;
