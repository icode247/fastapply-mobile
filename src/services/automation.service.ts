// Automation Service - Production-ready automation management
// Handles creating automations and adding URLs with retry logic and local state

import { ENDPOINTS } from "../constants/api";
import {
  AddUrlsResponse,
  Automation,
  AutomationListResponse,
  AutomationQueueStats,
  AutomationRunsResponse,
  AutomationStats,
  CreateAutomationDto,
  RescheduleUrlDto,
  UpdateAutomationDto,
  UrlInput,
  UrlListResponse,
  UrlStatus,
} from "../types/automation.types";
import { storage } from "../utils/storage";
import api, { getApiErrorMessage, isApiError, isNotFoundError } from "./api";

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
        const parsed = JSON.parse(cachedMap);
        // Clean up any invalid IDs (like "undefined" strings) from previous bugs
        this.profileAutomationMap = {};
        let hasInvalidEntries = false;
        for (const [profileId, automationId] of Object.entries(parsed)) {
          if (this.isValidIdStatic(automationId as string)) {
            this.profileAutomationMap[profileId] = automationId as string;
          } else {
            console.warn(`Removing invalid cached automation ID for profile ${profileId}:`, automationId);
            hasInvalidEntries = true;
          }
        }
        // Save cleaned state if we found invalid entries
        if (hasInvalidEntries) {
          await storage.setItem(
            STORAGE_KEYS.PROFILE_AUTOMATION_MAP,
            JSON.stringify(this.profileAutomationMap)
          );
        }
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
   * Static version of isValidId for use before instance methods are available
   */
  private isValidIdStatic(id: string | null | undefined): boolean {
    return Boolean(id && id !== "undefined" && id !== "null" && id.length > 0);
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
   * Helper to check if a value is a valid UUID (not undefined/null/"undefined")
   */
  private isValidId(id: string | null | undefined): id is string {
    return Boolean(id && id !== "undefined" && id !== "null" && id.length > 0);
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
    if (this.isValidId(cachedAutomationId)) {
      try {
        const automation = await this.getAutomation(cachedAutomationId);
        if (automation && this.isValidId(automation.id)) return automation;
      } catch {
        // Cached automation might be deleted, continue to search
        delete this.profileAutomationMap[profileId];
      }
    } else if (cachedAutomationId) {
      // Invalid cached ID (e.g., "undefined" string), clean it up
      delete this.profileAutomationMap[profileId];
      await this.saveState();
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

    const createPayload = {
      name: automationName,
      jobProfileId: profileId,
      applicationMode: "direct_urls",
      scheduleType: "daily",
      scheduleTime: "09:00", // Default to 9 AM
      isActive: true,
      maxApplicationsPerDay: 50,
      jobUrls: [initialUrl], // Must have at least 1 URL
    };

    // DEBUG: Log the create automation payload
    console.log("=== SWIPE: Creating new automation ===");
    console.log("CREATE AUTOMATION PAYLOAD:", JSON.stringify(createPayload, null, 2));

    const newAutomation = await this.createAutomation(createPayload);

    if (newAutomation && this.isValidId(newAutomation.id)) {
      this.profileAutomationMap[profileId] = newAutomation.id;
      await this.saveState();
    } else if (newAutomation) {
      console.error("Created automation has invalid ID:", newAutomation.id);
      return null;
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

    // DEBUG: Log incoming parameters
    console.log("=== SWIPE: addJobToQueue called ===");
    console.log("profileId:", profileId);
    console.log("jobUrl:", jobUrl);
    console.log("jobDetails:", JSON.stringify(jobDetails, null, 2));
    console.log("profileName:", profileName);

    const urlInput: UrlInput = {
      url: jobUrl,
      jobTitle: jobDetails?.title,
      company: jobDetails?.company,
      platform: jobDetails?.platform || this.detectPlatform(jobUrl),
    };

    console.log("urlInput:", JSON.stringify(urlInput, null, 2));

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

        if (!automation || !this.isValidId(automation.id)) {
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

      // Validate automation has a valid ID before proceeding
      if (!this.isValidId(automation.id)) {
        console.error("Retrieved automation has invalid ID:", automation.id);
        // Clear invalid cache and retry by creating new automation
        delete this.profileAutomationMap[profileId];
        await this.saveState();
        return {
          success: false,
          error: "Invalid automation state. Please try again.",
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
   * API expects: { jobUrls: string[] }
   */
  private async addUrlsWithRetry(
    automationId: string,
    urls: UrlInput[]
  ): Promise<{ success: boolean; error?: string; data?: AddUrlsResponse }> {
    // Validate automation ID before making API call
    if (!this.isValidId(automationId)) {
      console.error("addUrlsWithRetry called with invalid automationId:", automationId);
      return { success: false, error: "Invalid automation ID" };
    }

    // Extract just the URL strings for the API
    const jobUrls = urls.map((u) => u.url);

    // DEBUG: Log add URLs payload
    const endpoint = ENDPOINTS.AUTOMATIONS.URLS(automationId);
    console.log("=== API: POST addUrls ===");
    console.log("Endpoint:", endpoint);
    console.log("Request body:", JSON.stringify({ jobUrls }, null, 2));

    let lastError: string | undefined;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const response = await api.post<AddUrlsResponse>(
          endpoint,
          { jobUrls }
        );
        console.log("Response:", JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data };
      } catch (error) {
        console.error("API Error:", getApiErrorMessage(error));
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
   * Currently supported platforms: rippling, ashby, workable
   */
  private detectPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    // Supported platforms
    if (urlLower.includes("rippling.com")) return "rippling";
    if (urlLower.includes("ashbyhq.com")) return "ashby";
    if (urlLower.includes("workable.com")) return "workable";
    // Other common platforms (for reference)
    if (urlLower.includes("greenhouse.io")) return "greenhouse";
    if (urlLower.includes("lever.co")) return "lever";
    if (urlLower.includes("workday.com")) return "workday";
    if (urlLower.includes("linkedin.com")) return "linkedin";
    if (urlLower.includes("indeed.com")) return "indeed";
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
      console.log("=== API: POST createAutomation ===");
      console.log("Endpoint:", ENDPOINTS.AUTOMATIONS.BASE);
      console.log("Request body:", JSON.stringify(data, null, 2));

      const response = await api.post<Automation>(
        ENDPOINTS.AUTOMATIONS.BASE,
        data
      );

      console.log("Response:", JSON.stringify(response.data, null, 2));

      // Validate the response has a valid ID
      if (!this.isValidId(response.data?.id)) {
        console.error("Created automation returned invalid ID:", response.data?.id);
        return null;
      }
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
    if (!this.isValidId(id)) {
      console.warn("getAutomation called with invalid id:", id);
      return null;
    }
    try {
      const response = await api.get<Automation>(
        ENDPOINTS.AUTOMATIONS.BY_ID(id)
      );
      return response.data;
    } catch (error) {
      // 404 is expected when automation doesn't exist yet
      if (!isNotFoundError(error)) {
        console.error("Failed to get automation:", getApiErrorMessage(error));
      }
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
    if (!this.isValidId(id)) {
      console.warn("updateAutomation called with invalid id:", id);
      return null;
    }
    try {
      const endpoint = ENDPOINTS.AUTOMATIONS.BY_ID(id);
      console.log("=== API: PATCH updateAutomation ===");
      console.log("Endpoint:", endpoint);
      console.log("Request body:", JSON.stringify(data, null, 2));

      const response = await api.patch<Automation>(
        endpoint,
        data
      );

      console.log("Response:", JSON.stringify(response.data, null, 2));
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
   * API expects: { jobUrls: string[] }
   */
  async addUrls(id: string, jobUrls: string[]): Promise<AddUrlsResponse | null> {
    try {
      const response = await api.post<AddUrlsResponse>(
        ENDPOINTS.AUTOMATIONS.URLS(id),
        { jobUrls }
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
    if (!this.isValidId(id)) {
      console.warn("getQueueStats called with invalid id:", id);
      return null;
    }
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

  // ============ User-Level URL Methods ============

  /**
   * Get all job URLs for the authenticated user
   * Uses the new /api/v1/automations/urls/all endpoint
   */
  async getAllUserUrls(status?: UrlStatus): Promise<UrlListResponse> {
    try {
      const response = await api.get<{ success: boolean; data: any[]; total: number }>(
        ENDPOINTS.AUTOMATIONS.USER_URLS_ALL,
        { params: status ? { status } : undefined }
      );
      // API returns { success, data, total } - extract and normalize
      const rawData = response.data;
      return {
        data: rawData.data || [],
        total: rawData.total || 0,
      };
    } catch (error) {
      console.error("Failed to get all user URLs:", getApiErrorMessage(error));
      return { data: [], total: 0 };
    }
  }

  /**
   * Get queue statistics for the authenticated user
   * Uses the new /api/v1/automations/urls/stats endpoint
   */
  async getUserUrlStats(): Promise<AutomationQueueStats | null> {
    try {
      const response = await api.get<{ success: boolean; data: AutomationQueueStats }>(
        ENDPOINTS.AUTOMATIONS.USER_URLS_STATS
      );
      // API returns { success, data } - extract the data
      return response.data.data || null;
    } catch (error) {
      console.error("Failed to get user URL stats:", getApiErrorMessage(error));
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
