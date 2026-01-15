// Job Types - Aligned with ATS Job Search API

export interface JobLocation {
  location: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface JobCompensation {
  min: number;
  max: number;
  currency: string;
  period: string | null;
  raw_text: string;
  is_estimated: boolean;
}

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

export type JobSource = "greenhouse" | "lever_co" | "workday" | "other";

export interface Job {
  id: string;
  title: string;
  "company.name": string;
  listing_url: string;
  apply_url: string;
  locations: JobLocation[];
  compensation: JobCompensation | null;
  employment_type: EmploymentType;
  workplace_type: WorkplaceType;
  experience_level: ExperienceLevel;
  source: JobSource | string;
  date_posted: string;
  is_remote: boolean;
}

// Normalized job for UI display
export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  workMode: string;
  location: string;
  locations: JobLocation[];
  experience: string;
  description: string;
  postedAt: string;
  tags: string[];
  listingUrl: string;
  applyUrl: string;
  source: string;
  isRemote: boolean;
}

// Job search filters
export interface JobSearchFilters {
  query?: string;
  jobTypes?: EmploymentType[];
  workModes?: WorkplaceType[];
  experienceLevels?: ExperienceLevel[];
  locations?: string[];
  countries?: string[];
  states?: string[];
  cities?: string[];
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  companies?: string[];
  skills?: string[];
  postedAfter?: string;
  postedBefore?: string;
}

// Job search response
export interface JobSearchResponse {
  jobs: NormalizedJob[];
  total: number;
  page: number;
  limit: number;
  filters: JobSearchFilters;
}

// Utility function to normalize raw job data
export function normalizeJob(job: Job): NormalizedJob {
  const primaryLocation = job.locations[0];
  const locationStr = primaryLocation
    ? primaryLocation.location ||
      [primaryLocation.city, primaryLocation.state, primaryLocation.country]
        .filter(Boolean)
        .join(", ")
    : "Location not specified";

  const salary = job.compensation
    ? job.compensation.raw_text ||
      `$${(job.compensation.min / 1000).toFixed(0)}k - $${(job.compensation.max / 1000).toFixed(0)}k`
    : "Salary not disclosed";

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
    locations: job.locations,
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
