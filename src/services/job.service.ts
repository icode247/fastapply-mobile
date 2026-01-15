// Job Service - Load jobs from local JSON (replaceable with API)

import {
  Job,
  JobSearchFilters,
  JobSearchResponse,
  NormalizedJob,
  normalizeJob,
} from "../types/job.types";

// Import jobs from local JSON file
// TODO: Replace with API call when ready
import rawJobsData from "../data/jobs.json";

const jobsData = rawJobsData as Job[];

class JobService {
  private jobs: Job[] = jobsData;
  private normalizedJobs: NormalizedJob[] = [];
  private isInitialized = false;

  /**
   * Initialize the job service and normalize all jobs
   */
  initialize(): void {
    if (this.isInitialized) return;

    this.normalizedJobs = this.jobs.map((job) => normalizeJob(job));
    this.isInitialized = true;
  }

  /**
   * Get all jobs (normalized for UI)
   */
  getAllJobs(): NormalizedJob[] {
    this.initialize();
    return this.normalizedJobs;
  }

  /**
   * Get a job by ID
   */
  getJobById(id: string): NormalizedJob | undefined {
    this.initialize();
    return this.normalizedJobs.find((job) => job.id === id);
  }

  /**
   * Search jobs with filters
   */
  searchJobs(filters: JobSearchFilters): JobSearchResponse {
    this.initialize();

    let filteredJobs = [...this.normalizedJobs];

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

    if (filters.countries && filters.countries.length > 0) {
      const countries = filters.countries.map((c) => c.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some(
          (loc) =>
            loc.country && countries.includes(loc.country.toLowerCase())
        )
      );
    }

    if (filters.states && filters.states.length > 0) {
      const states = filters.states.map((s) => s.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some(
          (loc) => loc.state && states.includes(loc.state.toLowerCase())
        )
      );
    }

    if (filters.cities && filters.cities.length > 0) {
      const cities = filters.cities.map((c) => c.toLowerCase());
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some(
          (loc) => loc.city && cities.includes(loc.city.toLowerCase())
        )
      );
    }

    // Salary filters
    if (filters.salaryMin !== undefined) {
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.salaryMax === undefined || job.salaryMax >= filters.salaryMin!
      );
    }

    if (filters.salaryMax !== undefined) {
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.salaryMin === undefined || job.salaryMin <= filters.salaryMax!
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
      page: 1,
      limit: filteredJobs.length,
      filters,
    };
  }

  /**
   * Search jobs by voice command parameters
   */
  searchByVoiceParams(params: {
    jobTitle?: string;
    jobType?: string[];
    location?: string;
    country?: string;
    state?: string;
    city?: string;
    remote?: boolean;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    company?: string;
    skills?: string[];
  }): NormalizedJob[] {
    this.initialize();

    let filteredJobs = [...this.normalizedJobs];

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

    // Location filter (general)
    if (params.location) {
      const locationQuery = params.location.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.location.toLowerCase().includes(locationQuery)
      );
    }

    // Country filter
    if (params.country) {
      const countryQuery = params.country.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some(
          (loc) => loc.country && loc.country.toLowerCase().includes(countryQuery)
        )
      );
    }

    // State filter
    if (params.state) {
      const stateQuery = params.state.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some(
          (loc) => loc.state && loc.state.toLowerCase().includes(stateQuery)
        )
      );
    }

    // City filter
    if (params.city) {
      const cityQuery = params.city.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.locations.some(
          (loc) => loc.city && loc.city.toLowerCase().includes(cityQuery)
        )
      );
    }

    // Company filter
    if (params.company) {
      const companyQuery = params.company.toLowerCase();
      filteredJobs = filteredJobs.filter((job) =>
        job.company.toLowerCase().includes(companyQuery)
      );
    }

    // Salary filter
    if (params.salaryMin !== undefined) {
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.salaryMax === undefined || job.salaryMax >= params.salaryMin!
      );
    }

    if (params.salaryMax !== undefined) {
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.salaryMin === undefined || job.salaryMin <= params.salaryMax!
      );
    }

    // Skills filter
    if (params.skills && params.skills.length > 0) {
      const skills = params.skills.map((s) => s.toLowerCase());
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.tags.some((tag) =>
            skills.some((skill) => tag.toLowerCase().includes(skill))
          ) ||
          job.title.toLowerCase().includes(skills.join(" "))
      );
    }

    return filteredJobs;
  }

  /**
   * Get unique locations from all jobs
   */
  getUniqueLocations(): {
    countries: string[];
    states: string[];
    cities: string[];
  } {
    this.initialize();

    const countries = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();

    for (const job of this.normalizedJobs) {
      for (const loc of job.locations) {
        if (loc.country) countries.add(loc.country);
        if (loc.state) states.add(loc.state);
        if (loc.city) cities.add(loc.city);
      }
    }

    return {
      countries: Array.from(countries).sort(),
      states: Array.from(states).sort(),
      cities: Array.from(cities).sort(),
    };
  }

  /**
   * Get unique companies from all jobs
   */
  getUniqueCompanies(): string[] {
    this.initialize();
    const companies = new Set(this.normalizedJobs.map((job) => job.company));
    return Array.from(companies).sort();
  }

  /**
   * Get job statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    byWorkMode: Record<string, number>;
    byLocation: Record<string, number>;
    withSalary: number;
  } {
    this.initialize();

    const byType: Record<string, number> = {};
    const byWorkMode: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    let withSalary = 0;

    for (const job of this.normalizedJobs) {
      // Count by type
      byType[job.type] = (byType[job.type] || 0) + 1;

      // Count by work mode
      byWorkMode[job.workMode] = (byWorkMode[job.workMode] || 0) + 1;

      // Count by primary location (country)
      const country = job.locations[0]?.country || "Unknown";
      byLocation[country] = (byLocation[country] || 0) + 1;

      // Count jobs with salary
      if (job.salaryMin || job.salaryMax) {
        withSalary++;
      }
    }

    return {
      total: this.normalizedJobs.length,
      byType,
      byWorkMode,
      byLocation,
      withSalary,
    };
  }

  /**
   * Refresh jobs from source
   * TODO: Implement API call when ready
   */
  async refreshJobs(): Promise<void> {
    // In production, this would fetch from API:
    // const response = await api.get('/api/v1/jobs');
    // this.jobs = response.data;
    // this.normalizedJobs = this.jobs.map(normalizeJob);

    // For now, just re-normalize existing data
    this.normalizedJobs = this.jobs.map((job) => normalizeJob(job));
  }
}

// Export singleton instance
export const jobService = new JobService();
export default jobService;
