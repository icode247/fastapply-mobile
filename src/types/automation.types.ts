// Automation Types - Based on Backend API OpenAPI Spec

export type ApplicationMode = "platform_search" | "direct_urls";

export type ScheduleType =
  | "daily"
  | "weekly"
  | "custom";

export type UrlStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type AutomationRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

// Main automation entity
export interface Automation {
  id: string;
  userId: string;
  jobProfileId: string;
  name: string;
  isActive: boolean;
  applicationMode: ApplicationMode;
  scheduleType: ScheduleType;
  scheduleConfig?: ScheduleConfig;
  maxApplicationsPerRun?: number;
  maxApplicationsPerDay?: number;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  // Stats
  totalApplications?: number;
  successfulApplications?: number;
  failedApplications?: number;
}

export interface ScheduleConfig {
  time?: string; // HH:MM format
  timezone?: string;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  runDate?: string; // ISO date for 'once' type
}

// URL queue item for direct_urls mode
export interface AutomationUrl {
  id: string;
  automationId: string;
  url: string;
  status: UrlStatus;
  jobTitle?: string;
  company?: string;
  platform?: string;
  priority?: number;
  retryCount?: number;
  lastError?: string;
  processedAt?: string;
  createdAt: string;
}

// Automation run history
export interface AutomationRun {
  id: string;
  automationId: string;
  status: AutomationRunStatus;
  startedAt: string;
  completedAt?: string;
  applicationsAttempted: number;
  applicationsSuccessful: number;
  applicationsFailed: number;
  errorMessage?: string;
}

// Queue statistics
export interface AutomationQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  skipped: number;
  total: number;
}

// Automation statistics
export interface AutomationStats {
  totalRuns: number;
  totalApplications: number;
  successfulApplications: number;
  failedApplications: number;
  successRate: number;
  averageApplicationsPerRun: number;
  lastRunAt?: string;
  urlQueueStats?: AutomationQueueStats;
}

// DTOs for API requests

export interface CreateAutomationDto {
  name: string;
  jobProfileId: string;
  applicationMode: ApplicationMode;
  scheduleType: ScheduleType;
  scheduleTime?: string; // HH:MM format (e.g., "09:00")
  scheduleDays?: number[]; // Days for weekly schedule (0=Sunday, 6=Saturday)
  maxApplicationsPerRun?: number;
  maxApplicationsPerDay?: number;
  isActive?: boolean;
  jobUrls?: string[]; // Initial URLs for direct_urls mode
}

export interface UpdateAutomationDto {
  name?: string;
  isActive?: boolean;
  scheduleType?: ScheduleType;
  scheduleTime?: string; // HH:MM format (e.g., "09:00")
  scheduleDays?: number[]; // Days for weekly schedule (0=Sunday, 6=Saturday)
  maxApplicationsPerRun?: number;
  maxApplicationsPerDay?: number;
}

export interface AddUrlsDto {
  jobUrls: string[];
}

export interface UrlInput {
  url: string;
  jobTitle?: string;
  company?: string;
  platform?: string;
  priority?: number;
}

export interface RescheduleUrlDto {
  urlIds?: string[];
  rescheduleAll?: boolean;
}

// API Response types

export interface AutomationListResponse {
  data: Automation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AddUrlsResponse {
  added: number;
  duplicates: number;
  urls: AutomationUrl[];
}

export interface UrlListResponse {
  data: AutomationUrl[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AutomationRunsResponse {
  data: AutomationRun[];
  total: number;
  page: number;
  limit: number;
}

// Local state for managing automation in the app
export interface AutomationState {
  currentAutomationId: string | null;
  profileAutomationMap: Record<string, string>; // profileId -> automationId
  isCreating: boolean;
  isAddingUrls: boolean;
  error: string | null;
  pendingUrls: UrlInput[];
  lastSyncAt: string | null;
}

// Event types for tracking automation actions
export interface AutomationEvent {
  type: "created" | "url_added" | "activated" | "deactivated" | "error";
  automationId?: string;
  url?: string;
  error?: string;
  timestamp: string;
}
