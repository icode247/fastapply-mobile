// Job Types - Aligned with Job Search API

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance"
  | null;

export type WorkplaceType = "remote" | "hybrid" | "onsite" | null;

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | null;

// Supported ATS platforms - must match backend allowed values
export type JobPlatform = "rippling" | "ashby" | "workable";

export type DatePostedFilter =
  | "today"
  | "last_3_days"
  | "last_week"
  | "last_month"
  | "any";

// API Job response from /api/v1/jobs/search
export interface ApiJob {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  companyLogo?: string;
  url: string;
  applyUrl: string;
  location: string;
  salary: string | null;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  employmentType: string | null;
  workplaceType: string | null;
  experienceLevel: string | null;
  platform: JobPlatform;
  datePosted: string;
  isRemote: boolean;
  description?: string;
  benefits?: string[];
  keySkills?: string[];
  requirementsSummary?: string;
  visaSponsorship?: boolean;
}

// Legacy Job interface for backward compatibility (ATS format)
export interface Job {
  id: string;
  title: string;
  "company.name": string;
  listing_url: string;
  apply_url: string;
  locations: Array<{
    location: string;
    city: string | null;
    state: string | null;
    country: string | null;
  }>;
  compensation: {
    min: number;
    max: number;
    currency: string;
    period?: string;
    raw_text: string;
    is_estimated?: boolean;
  } | null;
  employment_type: EmploymentType;
  workplace_type: WorkplaceType;
  experience_level: ExperienceLevel;
  source: string;
  date_posted: string;
  is_remote: boolean;
}

// Career-site job format (from career-site-job-listing-api datasets)
export interface CareerSiteJob {
  id: string;
  title: string;
  organization: string;
  organization_url?: string;
  organization_logo?: string;
  url: string;
  source: string;
  source_domain?: string;
  date_posted: string;
  description_text?: string;
  employment_type?: string;
  location_type?: string;
  locations_derived?: string[];
  cities_derived?: string[];
  regions_derived?: string[];
  countries_derived?: string[];
  remote_derived?: boolean;
  salary_raw?: {
    "@type": string;
    currency: string;
    value: {
      "@type": string;
      minValue: number;
      maxValue: number;
      unitText: string;
    };
  } | null;
  ai_salary_currency?: string | null;
  ai_salary_value?: number | null;
  ai_salary_minvalue?: number | null;
  ai_salary_maxvalue?: number | null;
  ai_salary_unittext?: string | null;
  ai_experience_level?: string | null;
  ai_work_arrangement?: string | null;
  ai_key_skills?: string[] | null;
  ai_benefits?: string[] | null;
  ai_requirements_summary?: string | null;
  ai_visa_sponsorship?: boolean | null;
  ai_employment_type?: string | null;
}

// Normalized job for UI display
export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  logo: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  type: string;
  workMode: string;
  location: string;
  experience: string;
  description: string;
  postedAt: string;
  tags: string[];
  listingUrl: string;
  applyUrl: string;
  source: string;
  isRemote: boolean;
  benefits?: string[];
  keySkills?: string[];
  requirementsSummary?: string;
  visaSponsorship?: boolean;
}

// Job search filters (for local filtering)
export interface JobSearchFilters {
  query?: string;
  jobTitles?: string[];
  jobTypes?: EmploymentType[];
  workModes?: WorkplaceType[];
  experienceLevels?: ExperienceLevel[];
  locations?: string[];
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  companies?: string[];
  skills?: string[];
}

// API search request payload
export interface JobSearchRequest {
  keywords: string[];
  platforms?: JobPlatform[];
  locations?: string[];
  workModes?: WorkplaceType[];
  jobTypes?: EmploymentType[];
  experienceLevels?: ExperienceLevel[];
  datePosted?: DatePostedFilter;
  companyBlacklist?: string[];
  limit?: number;
}

// Job search response
export interface JobSearchResponse {
  jobs: NormalizedJob[];
  total: number;
}

// Utility function to normalize API job response
export function normalizeApiJob(job: ApiJob): NormalizedJob {
  const postedDate = new Date(job.datePosted);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const postedAt =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "1 day ago"
        : diffDays < 7
          ? `${diffDays} days ago`
          : diffDays < 30
            ? `${Math.floor(diffDays / 7)} weeks ago`
            : `${Math.floor(diffDays / 30)} months ago`;

  const employmentTypeMap: Record<string, string> = {
    full_time: "Full-time",
    Full_time: "Full-time",
    FULL_TIME: "Full-time",
    "Full-time": "Full-time",
    part_time: "Part-time",
    Part_time: "Part-time",
    PART_TIME: "Part-time",
    "Part-time": "Part-time",
    contract: "Contract",
    Contract: "Contract",
    CONTRACT: "Contract",
    internship: "Internship",
    Internship: "Internship",
    INTERNSHIP: "Internship",
    freelance: "Freelance",
    Freelance: "Freelance",
    FREELANCE: "Freelance",
  };

  const workModeMap: Record<string, string> = {
    remote: "Remote",
    Remote: "Remote",
    hybrid: "Hybrid",
    Hybrid: "Hybrid",
    onsite: "On-site",
    Onsite: "On-site",
    "on-site": "On-site",
    "On-site": "On-site",
  };

  const experienceLevelMap: Record<string, string> = {
    entry: "Entry Level",
    Entry: "Entry Level",
    mid: "Mid Level",
    Mid: "Mid Level",
    senior: "Senior Level",
    Senior: "Senior Level",
    lead: "Lead",
    Lead: "Lead",
    executive: "Executive",
    Executive: "Executive",
  };

  // Use keySkills from API if available, otherwise extract from title
  const tags = job.keySkills?.slice(0, 6) || extractTagsFromTitle(job.title);

  const salary = job.salary || "Salary not disclosed";
  const location = job.location || "Location not specified";

  // Use company logo from API, fallback to generated avatar
  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random&size=128`;
  const logo = job.companyLogo && job.companyLogo.trim() !== ""
    ? job.companyLogo
    : fallbackLogo;

  // Use actual description from API, fallback to generated summary
  const description = job.description ||
    `Apply for ${job.title} at ${job.company}. ${location}. ${salary}.`;

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyUrl: job.companyUrl,
    logo,
    salary,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    type: job.employmentType
      ? employmentTypeMap[job.employmentType] || job.employmentType
      : "Full-time",
    workMode: job.isRemote
      ? "Remote"
      : job.workplaceType
        ? workModeMap[job.workplaceType] || job.workplaceType
        : "On-site",
    location,
    experience: job.experienceLevel
      ? experienceLevelMap[job.experienceLevel] || job.experienceLevel
      : "Not specified",
    description,
    postedAt,
    tags,
    listingUrl: job.url,
    applyUrl: job.applyUrl,
    source: job.platform,
    isRemote: job.isRemote,
    benefits: job.benefits,
    keySkills: job.keySkills,
    requirementsSummary: job.requirementsSummary,
    visaSponsorship: job.visaSponsorship,
  };
}

// Legacy utility function to normalize raw job data (for backward compatibility)
export function normalizeJob(job: Job): NormalizedJob {
  const primaryLocation = job.locations?.[0];
  const locationStr = primaryLocation
    ? primaryLocation.location ||
      [primaryLocation.city, primaryLocation.state, primaryLocation.country]
        .filter(Boolean)
        .join(", ")
    : "Location not specified";

  let salary = "Salary not disclosed";
  if (job.compensation) {
    const { min, max, currency, period, raw_text } = job.compensation;
    if (min != null && max != null && (min > 0 || max > 0)) {
      salary = formatSalaryRange(min, max, currency, period);
    } else if (raw_text) {
      salary = cleanSalaryText(raw_text) || raw_text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Salary not disclosed";
    }
  }

  const postedDate = new Date(job.date_posted);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const postedAt =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "1 day ago"
        : diffDays < 7
          ? `${diffDays} days ago`
          : diffDays < 30
            ? `${Math.floor(diffDays / 7)} weeks ago`
            : `${Math.floor(diffDays / 30)} months ago`;

  const employmentTypeMap: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    freelance: "Freelance",
  };

  const workModeMap: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site",
  };

  // Extract tags from title
  const titleTags = extractTagsFromTitle(job.title);

  return {
    id: job.id,
    title: job.title,
    company: job["company.name"],
    logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(job["company.name"])}&background=random&size=128`,
    salary,
    salaryMin: job.compensation?.min,
    salaryMax: job.compensation?.max,
    type: job.employment_type
      ? employmentTypeMap[job.employment_type] || "Full-time"
      : "Full-time",
    workMode: job.is_remote
      ? "Remote"
      : job.workplace_type
        ? workModeMap[job.workplace_type] || "On-site"
        : "On-site",
    location: locationStr,
    experience: job.experience_level
      ? `${job.experience_level.charAt(0).toUpperCase()}${job.experience_level.slice(1)} Level`
      : "Not specified",
    description: `Apply for ${job.title} at ${job["company.name"]}. ${locationStr}. ${salary}.`,
    postedAt,
    tags: titleTags,
    listingUrl: job.listing_url,
    applyUrl: job.apply_url,
    source: job.source,
    isRemote: job.is_remote,
  };
}

// Normalize a career-site job to NormalizedJob
export function normalizeCareerSiteJob(job: CareerSiteJob): NormalizedJob {
  // Build location string
  const location =
    job.locations_derived?.join(", ") ||
    job.cities_derived?.join(", ") ||
    "Location not specified";

  // Build salary from ai_salary_* fields first, then salary_raw
  let salary = "Salary not disclosed";
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  let salaryCurrency: string | undefined;

  if (job.ai_salary_minvalue != null && job.ai_salary_maxvalue != null) {
    salaryMin = job.ai_salary_minvalue;
    salaryMax = job.ai_salary_maxvalue;
    salaryCurrency = job.ai_salary_currency || "USD";
    salary = formatSalaryRange(
      salaryMin,
      salaryMax,
      salaryCurrency,
      job.ai_salary_unittext || undefined
    );
  } else if (job.ai_salary_value != null) {
    const val = job.ai_salary_value;
    salaryCurrency = job.ai_salary_currency || "USD";
    const sym = salaryCurrency === "GBP" ? "£" : salaryCurrency === "EUR" ? "€" : "$";
    const isHourly =
      job.ai_salary_unittext === "HOUR" || job.ai_salary_unittext === "hour";
    salary = isHourly ? `${sym}${val.toFixed(2)}/hr` : `${sym}${val.toLocaleString("en-US")}`;
    salaryMin = val;
    salaryMax = val;
  } else if (job.salary_raw?.value) {
    const v = job.salary_raw.value;
    salaryMin = v.minValue;
    salaryMax = v.maxValue;
    salaryCurrency = job.salary_raw.currency || "USD";
    salary = formatSalaryRange(
      v.minValue,
      v.maxValue,
      salaryCurrency,
      v.unitText
    );
  }

  // Posted-at
  const postedDate = new Date(job.date_posted);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const postedAt =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "1 day ago"
        : diffDays < 7
          ? `${diffDays} days ago`
          : diffDays < 30
            ? `${Math.floor(diffDays / 7)} weeks ago`
            : `${Math.floor(diffDays / 30)} months ago`;

  // Work mode
  const isRemote = job.remote_derived || job.ai_work_arrangement === "remote";
  const workModeRaw = job.ai_work_arrangement || job.location_type;
  const workMode = isRemote
    ? "Remote"
    : workModeRaw === "hybrid"
      ? "Hybrid"
      : "On-site";

  // Experience
  const expMap: Record<string, string> = {
    entry: "Entry Level",
    mid: "Mid Level",
    senior: "Senior Level",
    lead: "Lead",
    executive: "Executive",
  };
  const experience = job.ai_experience_level
    ? expMap[job.ai_experience_level] || job.ai_experience_level
    : "Not specified";

  // Employment type
  const typeMap: Record<string, string> = {
    full_time: "Full-time",
    FULL_TIME: "Full-time",
    part_time: "Part-time",
    PART_TIME: "Part-time",
    contract: "Contract",
    CONTRACT: "Contract",
    internship: "Internship",
    INTERNSHIP: "Internship",
  };
  const empType =
    job.ai_employment_type || job.employment_type || "full_time";
  const type = typeMap[empType] || "Full-time";

  const tags =
    job.ai_key_skills?.slice(0, 6) || extractTagsFromTitle(job.title);

  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.organization)}&background=random&size=128`;
  const logo =
    job.organization_logo && job.organization_logo.trim() !== ""
      ? job.organization_logo
      : fallbackLogo;

  return {
    id: job.id,
    title: job.title,
    company: job.organization,
    companyUrl: job.organization_url,
    logo,
    salary,
    salaryMin,
    salaryMax,
    salaryCurrency,
    type,
    workMode,
    location,
    experience,
    description:
      job.description_text?.slice(0, 500) ||
      `Apply for ${job.title} at ${job.organization}. ${location}. ${salary}.`,
    postedAt,
    tags,
    listingUrl: job.url,
    applyUrl: job.url,
    source: job.source || job.source_domain || "career-site",
    isRemote,
    benefits: job.ai_benefits || undefined,
    keySkills: job.ai_key_skills || undefined,
    requirementsSummary: job.ai_requirements_summary || undefined,
    visaSponsorship: job.ai_visa_sponsorship || undefined,
  };
}

/**
 * Strip HTML tags/entities from a string and extract a salary-like value.
 * Returns null if no dollar amount or recognizable salary is found.
 */
function cleanSalaryText(raw: string): string | null {
  // Strip HTML tags
  let text = raw.replace(/<[^>]*>/g, " ");
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#xa;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Try to extract a salary pattern like "$X - $Y" or "$X/hr" etc.
  const salaryPattern =
    /(?:(?:Range:\s*)?(?:\$[\d,.]+[kK]?\s*(?:[-–—to]+\s*\$[\d,.]+[kK]?)?\s*(?:\/\s*(?:hr|hour|yr|year))?\s*(?:per\s+(?:hour|year|month|week|per-year-salary|per-hour-wage))?\s*(?:USD|GBP|EUR)?)|(?:£|€)[\d,.]+[kK]?\s*[-–—]\s*(?:£|€)?[\d,.]+[kK]?(?:\s*(?:USD|GBP|EUR))?)/i;
  const match = text.match(salaryPattern);
  if (match) {
    return match[0].replace(/\s+/g, " ").trim();
  }

  // If the cleaned text is short enough and contains a currency symbol, use it as-is
  if (text.length < 80 && /[$£€]/.test(text)) {
    return text;
  }

  return null;
}

/**
 * Format a salary range from numeric min/max values.
 */
function formatSalaryRange(
  min: number,
  max: number,
  currency?: string,
  period?: string
): string {
  const sym = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  const isHourly = period === "hour" || period === "HOUR";

  const fmt = (n: number) => {
    if (isHourly || n < 1000) return `${sym}${n.toFixed(2)}`;
    if (n >= 1000 && n < 10000) return `${sym}${n.toLocaleString("en-US")}`;
    return `${sym}${(n / 1000).toFixed(0)}K`;
  };

  const suffix = isHourly ? "/hr" : period === "month" ? "/mo" : "";
  if (min === max) return `${fmt(min)}${suffix}`;
  if (min > 0 && max <= 0) return `${fmt(min)}+${suffix}`;
  if (min <= 0 && max > 0) return `Up to ${fmt(max)}${suffix}`;
  return `${fmt(min)} - ${fmt(max)}${suffix}`;
}

// Extract relevant tags from job title
function extractTagsFromTitle(title: string): string[] {
  const techKeywords = [
    "React",
    "React Native",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "Java",
    "Go",
    "Rust",
    "AWS",
    "GCP",
    "Azure",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "REST",
    "SQL",
    "NoSQL",
    "MongoDB",
    "PostgreSQL",
    "Redis",
    "Kafka",
    "Machine Learning",
    "AI",
    "Data Science",
    "Frontend",
    "Backend",
    "Full Stack",
    "Mobile",
    "iOS",
    "Android",
    "DevOps",
    "SRE",
    "Security",
    "Cloud",
    "Blockchain",
    "Web3",
  ];

  const roleKeywords = [
    "Senior",
    "Junior",
    "Lead",
    "Principal",
    "Staff",
    "Manager",
    "Director",
    "VP",
    "Head",
    "Chief",
  ];

  const titleLower = title.toLowerCase();
  const foundTags: string[] = [];

  // Check for tech keywords
  for (const keyword of techKeywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      foundTags.push(keyword);
    }
  }

  // Check for role keywords
  for (const keyword of roleKeywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      foundTags.push(keyword);
    }
  }

  // Add generic tags based on title
  if (titleLower.includes("engineer") || titleLower.includes("developer")) {
    if (!foundTags.includes("Engineering")) foundTags.push("Engineering");
  }
  if (titleLower.includes("product")) {
    foundTags.push("Product");
  }
  if (titleLower.includes("design")) {
    foundTags.push("Design");
  }
  if (titleLower.includes("support")) {
    foundTags.push("Support");
  }

  return foundTags.slice(0, 4); // Limit to 4 tags
}
