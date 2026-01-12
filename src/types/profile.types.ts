// Job Profile Types

export interface ExperienceItem {
  id?: string;
  title: string;
  company: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  current?: boolean;
}

export interface EducationItem {
  id?: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface ProjectItem {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  technologies?: string;
}

export interface Demographics {
  gender?: string;
  dateOfBirth?: string;
  race?: string;
  disabilityStatus?: string;
  veteranStatus?: string;
}

export interface JobPreferences {
  jobType?: string[];
  experience?: string[];
  salary?: [number, number];
  desiredSalary?: number; // Annual salary target
  positions?: string[];
  remoteOnly?: boolean;
  companyBlacklist?: string[];
  locations?: string[];
  securityClearance?: string;
  noticePeriod?: string;
}

export interface Resume {
  id: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isPrimary: boolean;
  uploadedAt: string;
  parsedData?: ParsedResume;
}

export interface JobProfile {
  id: string;
  userId: string;
  name: string;
  isPrimary: boolean;

  // Personal Info
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  headline?: string;
  summary?: string;

  // Location
  streetAddress?: string;
  currentCity?: string;
  state?: string;
  country?: string;
  zipcode?: string;

  // Professional Info
  yearsOfExperience?: number;
  skills?: string[];
  languages?: string[];
  certifications?: string[];

  // Work History
  experience?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];

  // Links
  linkedinURL?: string;
  githubURL?: string;
  website?: string;
  portfolioURL?: string; // Alias for website or specific portfolio

  // Work Authorization
  workAuthorization?: string;
  requiresSponsorship?: boolean;

  // Preferences
  preferences?: JobPreferences;

  // Demographics
  demographics?: Demographics;

  // Documents
  coverLetterTemplate?: string;
  resumes?: Resume[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateJobProfileDto {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  headline?: string;
  summary?: string;
  streetAddress?: string;
  currentCity?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  yearsOfExperience?: number;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  experience?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];
  linkedinURL?: string;
  githubURL?: string;
  website?: string;
  portfolioURL?: string;
  workAuthorization?: string;
  requiresSponsorship?: boolean;
  preferences?: JobPreferences;
  demographics?: Demographics;
  coverLetterTemplate?: string;
}

export type UpdateJobProfileDto = Partial<CreateJobProfileDto>;

// Parsed Resume (from resume parser API)
export interface ParsedResume {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  headline?: string;
  summary?: string;
  streetAddress?: string;
  currentCity?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  yearsOfExperience?: number;
  desiredSalary?: string;
  githubURL?: string;
  linkedinURL?: string;
  website?: string;
  portfolioURL?: string;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  education?: EducationItem[];
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
  // AI inferred demographics or preferences sometimes come from parsing
  workAuthorization?: string;
  requiresSponsorship?: boolean;
}

export interface ParsedResumeResponse {
  success: boolean;
  data?: ParsedResume;
  error?: string;
  metadata?: Record<string, unknown>;
}
