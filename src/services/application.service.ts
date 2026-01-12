import { ENDPOINTS } from "../constants/api";
import {
  Application,
  ApplicationFilters,
  ApplicationStats,
  CreateApplicationDto,
  PaginatedResponse,
  UpdateApplicationDto,
} from "../types";
import { api } from "./api";

export interface GetApplicationsParams {
  page?: number;
  limit?: number;
  filters?: ApplicationFilters;
}

export const applicationService = {
  /**
   * Get all applications for the current user
   */
  async getApplications(
    params?: GetApplicationsParams
  ): Promise<PaginatedResponse<Application>> {
    const { page = 1, limit = 20, filters } = params || {};

    const searchTerm = filters?.search?.toLowerCase();

    // If searching, fetch more items to filter locally
    const queryParams = new URLSearchParams({
      page: String(searchTerm ? 1 : page),
      limit: String(searchTerm ? 100 : limit),
    });

    if (filters?.status) {
      queryParams.append("status", filters.status);
    }
    if (filters?.platform) {
      queryParams.append("platform", filters.platform);
    }
    if (filters?.startDate) {
      queryParams.append("startDate", filters.startDate);
    }
    if (filters?.endDate) {
      queryParams.append("endDate", filters.endDate);
    }
    // Skip appending 'search' to queryParams to avoid 400 Error

    const response = await api.get<any>(
      `${ENDPOINTS.APPLICATIONS.BASE}?${queryParams.toString()}`
    );

    // Normalize response to match PaginatedResponse interface
    const rawData = response.data;
    let apps = Array.isArray(rawData)
      ? rawData
      : rawData.applications ||
        rawData.data ||
        rawData.items ||
        rawData.results ||
        [];

    // Perform client-side filtering if search term exists
    if (searchTerm) {
      apps = apps.filter(
        (app: Application) =>
          (app.company && app.company.toLowerCase().includes(searchTerm)) ||
          (app.jobTitle && app.jobTitle.toLowerCase().includes(searchTerm))
      );
    }

    return {
      data: searchTerm ? apps : apps,
      total: searchTerm ? apps.length : rawData.total || apps.length,
      page: searchTerm ? 1 : rawData.page || page,
      limit: searchTerm ? apps.length : rawData.limit || limit,
      totalPages: searchTerm
        ? 1
        : rawData.totalPages ||
          Math.ceil((rawData.total || apps.length) / limit),
    };
  },

  /**
   * Get a single application by ID
   */
  async getApplication(id: string): Promise<Application> {
    const response = await api.get<Application>(
      ENDPOINTS.APPLICATIONS.BY_ID(id)
    );
    return response.data;
  },

  /**
   * Get application statistics
   */
  async getStats(): Promise<ApplicationStats> {
    const response = await api.get<ApplicationStats>(
      ENDPOINTS.APPLICATIONS.STATS
    );
    return response.data;
  },

  /**
   * Check if user can apply to a specific job
   */
  async canApply(
    jobId: string
  ): Promise<{ canApply: boolean; reason?: string }> {
    const response = await api.get<{ canApply: boolean; reason?: string }>(
      `${ENDPOINTS.APPLICATIONS.CAN_APPLY}?jobId=${jobId}`
    );
    return response.data;
  },

  /**
   * Create a new application
   */
  async createApplication(data: CreateApplicationDto): Promise<Application> {
    const response = await api.post<Application>(
      ENDPOINTS.APPLICATIONS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Update an application
   */
  async updateApplication(
    id: string,
    data: UpdateApplicationDto
  ): Promise<Application> {
    const response = await api.patch<Application>(
      ENDPOINTS.APPLICATIONS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Delete an application
   */
  async deleteApplication(id: string): Promise<void> {
    await api.delete(ENDPOINTS.APPLICATIONS.BY_ID(id));
  },

  /**
   * Retry a failed application
   */
  async retryApplication(id: string): Promise<Application> {
    const response = await api.post<Application>(
      ENDPOINTS.APPLICATIONS.RETRY(id)
    );
    return response.data;
  },

  /**
   * Get applications grouped by status
   */
  async getApplicationsByStatus(): Promise<Record<string, Application[]>> {
    const allApplications = await this.getApplications({ limit: 100 });

    return allApplications.data.reduce((acc, app) => {
      const status = app.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(app);
      return acc;
    }, {} as Record<string, Application[]>);
  },

  /**
   * Get recent applications (last N applications)
   */
  async getRecentApplications(limit = 10): Promise<Application[]> {
    const response = await this.getApplications({
      limit,
    });

    // Handle PaginatedResponse (data), direct array, or wrapping properties (applications/items/results)
    const rawResponse = response as any;
    let apps: Application[] = [];

    if (Array.isArray(response)) {
      apps = response;
    } else if (Array.isArray(rawResponse.applications)) {
      apps = rawResponse.applications;
    } else if (Array.isArray(rawResponse.data)) {
      apps = rawResponse.data;
    } else if (Array.isArray(rawResponse.items)) {
      apps = rawResponse.items;
    } else if (Array.isArray(rawResponse.results)) {
      apps = rawResponse.results;
    }

    // Sort to ensure we show the most recent ones first
    apps.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return apps.slice(0, limit);
  },
};

export default applicationService;
