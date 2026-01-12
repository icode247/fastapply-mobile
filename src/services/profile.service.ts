import { ENDPOINTS } from "../constants/api";
import {
  CreateJobProfileDto,
  JobProfile,
  ParsedResumeResponse,
  Resume,
  UpdateJobProfileDto,
} from "../types";
import { FileData, api, uploadFile } from "./api";

export const profileService = {
  /**
   * Get all job profiles for the current user
   */
  async getProfiles(): Promise<JobProfile[]> {
    const response = await api.get<any>(ENDPOINTS.PROFILES.BASE);
    const data = response.data;

    let profiles: JobProfile[] = [];
    if (Array.isArray(data)) {
      profiles = data;
    } else {
      profiles = data.profiles || data.data || data.items || [];
    }

    // Map isDefault to isPrimary if isPrimary is missing
    return profiles.map((p: any) => ({
      ...p,
      isPrimary: p.isPrimary ?? p.isDefault,
    }));
  },

  /**
   * Get primary/default job profile
   */
  async getPrimaryProfile(): Promise<JobProfile | null> {
    try {
      const response = await api.get<JobProfile>(ENDPOINTS.PROFILES.PRIMARY);
      return response.data;
    } catch (error) {
      // If no primary profile exists
      return null;
    }
  },

  /**
   * Get a specific job profile by ID
   */
  async getProfile(id: string): Promise<JobProfile> {
    const response = await api.get<JobProfile>(ENDPOINTS.PROFILES.BY_ID(id));
    return response.data;
  },

  /**
   * Create a new job profile
   */
  async createProfile(data: CreateJobProfileDto): Promise<JobProfile> {
    const response = await api.post<JobProfile>(ENDPOINTS.PROFILES.BASE, data);
    return response.data;
  },

  /**
   * Update an existing job profile
   */
  async updateProfile(
    id: string,
    data: UpdateJobProfileDto
  ): Promise<JobProfile> {
    const response = await api.patch<JobProfile>(
      ENDPOINTS.PROFILES.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Delete a job profile
   */
  async deleteProfile(id: string): Promise<void> {
    await api.delete(ENDPOINTS.PROFILES.BY_ID(id));
  },

  /**
   * Set a profile as the primary/default profile
   */
  async setPrimaryProfile(id: string): Promise<JobProfile> {
    const response = await api.post<JobProfile>(
      ENDPOINTS.PROFILES.SET_DEFAULT(id)
    );
    return response.data;
  },

  /**
   * Get all resumes for a job profile
   */
  async getResumes(profileId: string): Promise<Resume[]> {
    const response = await api.get<Resume[]>(
      ENDPOINTS.PROFILES.RESUMES(profileId)
    );
    return response.data;
  },

  /**
   * Upload a resume to a job profile
   */
  async uploadResume(
    profileId: string,
    file: FileData,
    onProgress?: (progress: number) => void
  ): Promise<Resume> {
    const response = await uploadFile(
      ENDPOINTS.PROFILES.RESUMES(profileId),
      file,
      onProgress
    );
    return response.data;
  },

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: string): Promise<void> {
    await api.delete(ENDPOINTS.PROFILES.DELETE_RESUME(resumeId));
  },

  /**
   * Set a resume as primary for its profile
   */
  async setPrimaryResume(resumeId: string): Promise<Resume> {
    const response = await api.post<Resume>(
      ENDPOINTS.PROFILES.SET_PRIMARY_RESUME(resumeId)
    );
    return response.data;
  },

  /**
   * Get download URL for a resume
   */
  getResumeDownloadUrl(resumeId: string): string {
    return `${ENDPOINTS.PROFILES.DOWNLOAD_RESUME(resumeId)}`;
  },
};

// Resume Parser Service (separate from profile-attached resumes)
export const resumeParserService = {
  /**
   * Parse a resume file and extract structured data
   */
  async parseResume(
    file: FileData,
    onProgress?: (progress: number) => void
  ): Promise<ParsedResumeResponse> {
    const response = await uploadFile(ENDPOINTS.RESUME.PARSE, file, onProgress);
    return response.data;
  },

  /**
   * Extract raw text from a resume file
   */
  async extractText(
    file: FileData,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    const response = await uploadFile(
      ENDPOINTS.RESUME.EXTRACT_TEXT,
      file,
      onProgress
    );
    return response.data;
  },
};

export default profileService;
