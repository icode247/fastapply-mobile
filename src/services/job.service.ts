// Job Service - Efficient job fetching with seamless pagination
// Users should never see loading states after the initial load

import { ENDPOINTS } from "../constants/api";
import {
  ApiJob,
  DatePostedFilter,
  EmploymentType,
  ExperienceLevel,
  JobPlatform,
  JobSearchFilters,
  JobSearchResponse,
  NormalizedJob,
  normalizeApiJob,
  WorkplaceType,
} from "../types/job.types";
import api from "./api";

// Supported ATS platforms - must match backend allowed values
const SUPPORTED_PLATFORMS: JobPlatform[] = ["rippling", "ashby", "workable"];

// Configuration
const BATCH_SIZE = 50; // Jobs per API request
const PREFETCH_THRESHOLD = 10; // Start prefetch when this many jobs remain

// Job preferences for API search
export interface JobPreferences {
  keywords?: string[];
  locations?: string[];
  workModes?: WorkplaceType[];
  jobTypes?: EmploymentType[];
  experienceLevels?: ExperienceLevel[];
  platforms?: JobPlatform[];
  datePosted?: DatePostedFilter;
  companyBlacklist?: string[];
  limit?: number;
}

// API response structure
interface JobSearchApiResponse {
  success: boolean;
  data: {
    jobs: ApiJob[];
    total: number;
    hasMore?: boolean;
  };
}

// Subscription callback type
type JobServiceListener = () => void;

class JobService {
  // Core job data
  private jobs: NormalizedJob[] = [];
  private fetchedJobIds = new Set<string>();

  // Pagination state
  private hasMoreJobs = true;
  private isFetching = false;
  private isPrefetching = false;
  private lastError: string | null = null;

  // Current search preferences (for consistent pagination)
  private currentPreferences: JobPreferences | null = null;

  // Listeners for state changes
  private listeners: JobServiceListener[] = [];

  /**
   * Subscribe to state changes
   */
  subscribe(listener: JobServiceListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Build API payload from preferences
   */
  private buildPayload(preferences?: JobPreferences): Record<string, unknown> {
    const prefs = preferences || this.currentPreferences;

    const payload: Record<string, unknown> = {
      keywords: prefs?.keywords || ["Software Engineer"],
      limit: prefs?.limit || BATCH_SIZE,
      platforms:
        prefs?.platforms?.filter((p) => SUPPORTED_PLATFORMS.includes(p)) ||
        SUPPORTED_PLATFORMS,
    };

    // Add optional fields only if they have values
    if (prefs?.locations && prefs.locations.length > 0) {
      payload.locations = prefs.locations;
    }
    if (prefs?.workModes && prefs.workModes.length > 0) {
      payload.workModes = prefs.workModes;
    }
    if (prefs?.jobTypes && prefs.jobTypes.length > 0) {
      payload.jobTypes = prefs.jobTypes;
    }
    if (prefs?.experienceLevels && prefs.experienceLevels.length > 0) {
      payload.experienceLevels = prefs.experienceLevels;
    }
    if (prefs?.datePosted) {
      payload.datePosted = prefs.datePosted;
    }
    if (prefs?.companyBlacklist && prefs.companyBlacklist.length > 0) {
      payload.companyBlacklist = prefs.companyBlacklist;
    }

    // Note: API doesn't support excludeIds - we filter duplicates client-side

    return payload;
  }

  /**
   * Fetch initial jobs - resets state and fetches first batch
   */
  async fetchInitialJobs(preferences?: JobPreferences): Promise<NormalizedJob[]> {
    // Reset state for fresh fetch
    this.jobs = [];
    this.fetchedJobIds.clear();
    this.hasMoreJobs = true;
    this.lastError = null;

    // Store preferences for subsequent fetches
    if (preferences) {
      this.currentPreferences = preferences;
    }

    return this.fetchJobsBatch();
  }

  /**
   * Fetch more jobs - appends to existing jobs
   * Returns the newly fetched jobs (not all jobs)
   */
  async fetchMoreJobs(): Promise<NormalizedJob[]> {
    if (this.isFetching || !this.hasMoreJobs) {
      return [];
    }

    return this.fetchJobsBatch();
  }

  /**
   * Internal: Fetch a batch of jobs from the API
   */
  private async fetchJobsBatch(): Promise<NormalizedJob[]> {
    if (this.isFetching) {
      return [];
    }

    this.isFetching = true;
    this.lastError = null;
    this.notifyListeners();

    try {
      const payload = this.buildPayload();
      console.log("[JobService] Fetching jobs:", {
        existingCount: this.jobs.length,
        excludeCount: this.fetchedJobIds.size,
      });

      const response = await api.post<JobSearchApiResponse>(
        ENDPOINTS.JOBS.SEARCH,
        payload
      );

      if (response.data.success && response.data.data?.jobs?.length > 0) {
        const newApiJobs = response.data.data.jobs;

        // Filter out any duplicates (in case excludeIds isn't supported)
        const uniqueJobs = newApiJobs.filter(
          (job) => !this.fetchedJobIds.has(job.id)
        );

        if (uniqueJobs.length === 0) {
          // All returned jobs were duplicates - no more new jobs
          console.log("[JobService] No new unique jobs found");
          this.hasMoreJobs = false;
          this.notifyListeners();
          return [];
        }

        // Track fetched IDs
        uniqueJobs.forEach((job) => this.fetchedJobIds.add(job.id));

        // Normalize and append
        const normalizedJobs = uniqueJobs.map((job) => normalizeApiJob(job));
        this.jobs = [...this.jobs, ...normalizedJobs];

        // Check if we got fewer jobs than requested (indicates no more available)
        if (newApiJobs.length < BATCH_SIZE) {
          this.hasMoreJobs = false;
        }

        console.log("[JobService] Fetched jobs:", {
          newJobs: normalizedJobs.length,
          totalJobs: this.jobs.length,
          hasMore: this.hasMoreJobs,
        });

        this.notifyListeners();
        return normalizedJobs;
      } else {
        console.log("[JobService] API returned no jobs");
        this.hasMoreJobs = false;
        this.notifyListeners();
        return [];
      }
    } catch (error) {
      console.error("[JobService] Failed to fetch jobs:", error);
      this.lastError =
        error instanceof Error ? error.message : "Failed to fetch jobs";

      // Stop trying to fetch more on API errors (e.g., 400 Bad Request)
      // This prevents repeated failed requests
      this.hasMoreJobs = false;

      this.notifyListeners();
      return [];
    } finally {
      this.isFetching = false;
      this.notifyListeners();
    }
  }

  /**
   * Prefetch more jobs in the background
   * Call this when the user approaches the end of current jobs
   * Non-blocking - will not show loading states to user
   */
  prefetchIfNeeded(currentIndex: number): void {
    const remainingJobs = this.jobs.length - currentIndex;

    // Only prefetch if:
    // 1. Not already fetching/prefetching
    // 2. There are more jobs available
    // 3. Remaining jobs are at or below threshold
    if (
      this.isFetching ||
      this.isPrefetching ||
      !this.hasMoreJobs ||
      remainingJobs > PREFETCH_THRESHOLD
    ) {
      return;
    }

    console.log("[JobService] Starting prefetch, remaining jobs:", remainingJobs);
    this.isPrefetching = true;

    // Fetch in background without blocking
    this.fetchJobsBatch()
      .then((newJobs) => {
        if (newJobs.length > 0) {
          console.log("[JobService] Prefetch complete:", newJobs.length, "new jobs");
        }
      })
      .catch((error) => {
        console.error("[JobService] Prefetch failed:", error);
      })
      .finally(() => {
        this.isPrefetching = false;
      });
  }

  /**
   * Get all jobs
   */
  getAllJobs(): NormalizedJob[] {
    return this.jobs;
  }

  /**
   * Get jobs starting from a specific index
   * Useful for getting only remaining jobs
   */
  getJobsFrom(startIndex: number): NormalizedJob[] {
    return this.jobs.slice(startIndex);
  }

  /**
   * Get a job by ID
   */
  getJobById(id: string): NormalizedJob | undefined {
    return this.jobs.find((job) => job.id === id);
  }

  /**
   * Get job at specific index
   */
  getJobAtIndex(index: number): NormalizedJob | undefined {
    return this.jobs[index];
  }

  /**
   * Get total job count
   */
  getJobCount(): number {
    return this.jobs.length;
  }

  /**
   * Check if there are more jobs available from API
   */
  getHasMoreJobs(): boolean {
    return this.hasMoreJobs;
  }

  /**
   * Check if currently fetching (initial load)
   */
  isFetchingJobs(): boolean {
    return this.isFetching && this.jobs.length === 0;
  }

  /**
   * Check if currently prefetching (background fetch)
   */
  isPrefetchingJobs(): boolean {
    return this.isPrefetching;
  }

  /**
   * Get last error
   */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Check if jobs are loaded
   */
  hasJobs(): boolean {
    return this.jobs.length > 0;
  }

  /**
   * Search/filter jobs locally from the fetched results
   */
  searchJobs(filters: JobSearchFilters): JobSearchResponse {
    let filteredJobs = [...this.jobs];

    // Text query search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Job titles filter
    if (filters.jobTitles && filters.jobTitles.length > 0) {
      const titles = filters.jobTitles.map((t) => t.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        titles.some(
          (title) =>
            job.title.toLowerCase().includes(title) ||
            job.tags.some((tag) => tag.toLowerCase().includes(title))
        )
      );
    }

    // Remote only filter
    if (filters.remoteOnly) {
      filteredJobs = filteredJobs.filter((job) => job.isRemote);
    }

    // Job types filter
    if (filters.jobTypes && filters.jobTypes.length > 0) {
      const types = filters.jobTypes.map((t) => t?.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        types.includes(job.type.toLowerCase().replace("-", "_"))
      );
    }

    // Work modes filter
    if (filters.workModes && filters.workModes.length > 0) {
      const modes = filters.workModes.map((m) => m?.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        modes.includes(job.workMode.toLowerCase().replace("-", ""))
      );
    }

    // Location filters
    if (filters.locations && filters.locations.length > 0) {
      const locations = filters.locations.map((l) => l.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        locations.some((loc) => job.location.toLowerCase().includes(loc))
      );
    }

    // Company filter
    if (filters.companies && filters.companies.length > 0) {
      const companies = filters.companies.map((c) => c.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        companies.some((comp) => job.company.toLowerCase().includes(comp))
      );
    }

    // Skills/tags filter
    if (filters.skills && filters.skills.length > 0) {
      const skills = filters.skills.map((s) => s.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        job.tags.some((tag) =>
          skills.some((skill) => tag.toLowerCase().includes(skill))
        )
      );
    }

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
    };
  }

  /**
   * Search jobs by voice command parameters
   */
  searchByVoiceParams(params: {
    jobTitle?: string;
    jobType?: string[];
    location?: string;
    remote?: boolean;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    company?: string;
    skills?: string[];
  }): NormalizedJob[] {
    let filteredJobs = [...this.jobs];

    // Job title search
    if (params.jobTitle) {
      const titleQuery = params.jobTitle.toLowerCase();
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(titleQuery) ||
          job.tags.some((tag) => tag.toLowerCase().includes(titleQuery))
      );
    }

    // Remote filter
    if (params.remote) {
      filteredJobs = filteredJobs.filter(
        (job) => job.isRemote || job.workMode.toLowerCase() === "remote"
      );
    }

    // Location filter
    if (params.location) {
      const locationQuery = params.location.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.location.toLowerCase().includes(locationQuery)
      );
    }

    // Company filter
    if (params.company) {
      const companyQuery = params.company.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.company.toLowerCase().includes(companyQuery)
      );
    }

    // Skills filter
    if (params.skills && params.skills.length > 0) {
      const skills = params.skills.map((s) => s.toLowerCase());
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.tags.some((tag) =>
            skills.some((skill) => tag.toLowerCase().includes(skill))
          ) || job.title.toLowerCase().includes(skills.join(" "))
      );
    }

    return filteredJobs;
  }

  /**
   * Get unique locations from fetched jobs
   */
  getUniqueLocations(): string[] {
    const locations = new Set<string>();
    for (const job of this.jobs) {
      if (job.location && job.location !== "Location not specified") {
        locations.add(job.location);
      }
    }
    return Array.from(locations).sort();
  }

  /**
   * Get unique companies from fetched jobs
   */
  getUniqueCompanies(): string[] {
    const companies = new Set(this.jobs.map((job) => job.company));
    return Array.from(companies).sort();
  }

  /**
   * Get job statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    byWorkMode: Record<string, number>;
    bySource: Record<string, number>;
    withSalary: number;
  } {
    const byType: Record<string, number> = {};
    const byWorkMode: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let withSalary = 0;

    for (const job of this.jobs) {
      byType[job.type] = (byType[job.type] || 0) + 1;
      byWorkMode[job.workMode] = (byWorkMode[job.workMode] || 0) + 1;
      bySource[job.source] = (bySource[job.source] || 0) + 1;
      if (job.salary && job.salary !== "Salary not disclosed") {
        withSalary++;
      }
    }

    return {
      total: this.jobs.length,
      byType,
      byWorkMode,
      bySource,
      withSalary,
    };
  }

  /**
   * Reset the service state (useful for logout or filter changes)
   */
  reset(): void {
    this.jobs = [];
    this.fetchedJobIds.clear();
    this.hasMoreJobs = true;
    this.isFetching = false;
    this.isPrefetching = false;
    this.lastError = null;
    this.currentPreferences = null;
    this.notifyListeners();
  }

  // Legacy method aliases for backward compatibility
  async fetchJobs(preferences?: JobPreferences): Promise<NormalizedJob[]> {
    return this.fetchInitialJobs(preferences);
  }

  isLoadingJobs(): boolean {
    return this.isFetchingJobs();
  }
}

// Export singleton instance
export const jobService = new JobService();
export default jobService;
