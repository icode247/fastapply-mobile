// Application Types

export type ApplicationStatus =
  | "pending"
  | "processing"
  | "submitted"
  | "completed"
  | "failed"
  | "cancelled";

export interface ApplicationQuestion {
  id?: string;
  question: string;
  answer: string;
  fieldType?: string;
  confidence?: number;
}

export interface Application {
  id: string;
  userId: string;
  jobProfileId?: string;

  // Job Info
  jobId?: string;
  jobTitle?: string;
  company?: string;
  jobLocation?: string;
  jobUrl?: string;
  jobDescription?: string;
  platform?: string;

  // Status
  status: ApplicationStatus;
  statusMessage?: string;
  appliedAt?: string;
  failedReason?: string;
  retryCount?: number;

  // Application Data
  resumeUsed?: {
    id: string;
    fileName: string;
    fileUrl?: string;
  };
  questionsAnswered?: ApplicationQuestion[];
  coverLetterUsed?: string;

  // Metadata
  automationId?: string;
  source?: "manual" | "automation" | "extension";

  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  processing: number;
  completed: number;
  failed: number;
  pending: number;
  submitted: number; // Added based on API response
  thisWeek?: number;
  thisMonth?: number;
}

export interface CreateApplicationDto {
  jobId?: string;
  jobTitle?: string;
  company?: string;
  jobLocation?: string;
  jobUrl?: string;
  jobDescription?: string;
  platform?: string;
  jobProfileId?: string;
}

export type UpdateApplicationDto = Partial<{
  status: ApplicationStatus;
  statusMessage: string;
  appliedAt: string;
  failedReason: string;
  questionsAnswered: ApplicationQuestion[];
  coverLetterUsed: string;
}>;

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  platform?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
