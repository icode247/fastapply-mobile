// Local job samples loader — used when EXPO_PUBLIC_USE_API_JOBS !== "true"
// Avoids hitting the API during development/testing

import {
  CareerSiteJob,
  Job,
  NormalizedJob,
  normalizeCareerSiteJob,
  normalizeJob,
} from "../types/job.types";

// Static imports (React Native requires static require for bundling)
import feedJobs from "../../job-samples/dataset_ats-jobs-feed_2026-02-07_23-04-05-743.json";
import searchJobs1 from "../../job-samples/dataset_ats-jobs-search_2026-01-02_21-53-59-590.json";
import searchJobs2 from "../../job-samples/dataset_ats-jobs-search_2026-01-11_21-10-27-667.json";
import careerJobs1 from "../../job-samples/dataset_career-site-job-listing-api_2026-01-28_21-32-28-539.json";
import careerJobs2 from "../../job-samples/dataset_career-site-job-listing-api_2026-02-06_14-04-19-205.json";

// Detect if a raw job object is career-site format (has "organization" key)
function isCareerSiteFormat(job: Record<string, unknown>): boolean {
  return "organization" in job && !("company.name" in job);
}

// Normalize any raw job object to NormalizedJob
function normalizeAnyJob(raw: Record<string, unknown>): NormalizedJob {
  if (isCareerSiteFormat(raw)) {
    return normalizeCareerSiteJob(raw as unknown as CareerSiteJob);
  }
  return normalizeJob(raw as unknown as Job);
}

// Merge all datasets, deduplicate by id, normalize
function loadAllLocalJobs(): NormalizedJob[] {
  const allRaw: Record<string, unknown>[] = [
    ...(feedJobs as Record<string, unknown>[]),
    ...(searchJobs1 as Record<string, unknown>[]),
    ...(searchJobs2 as Record<string, unknown>[]),
    ...(careerJobs1 as Record<string, unknown>[]),
    ...(careerJobs2 as Record<string, unknown>[]),
  ];

  const seen = new Set<string>();
  const normalized: NormalizedJob[] = [];

  for (const raw of allRaw) {
    const id = raw.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push(normalizeAnyJob(raw));
  }

  return normalized;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let cachedJobs: NormalizedJob[] | null = null;

/**
 * Get a batch of local sample jobs, normalized for UI display.
 * Shuffles on first load, then paginates through the full set.
 */
export function getLocalJobsBatch(
  offset: number,
  limit: number
): { jobs: NormalizedJob[]; hasMore: boolean } {
  if (!cachedJobs) {
    cachedJobs = shuffle(loadAllLocalJobs());
  }

  const slice = cachedJobs.slice(offset, offset + limit);

  return {
    jobs: slice,
    hasMore: offset + limit < cachedJobs.length,
  };
}

/**
 * Reset the cached shuffle (e.g. on new search)
 */
export function resetLocalJobs(): void {
  cachedJobs = null;
}

/**
 * Total count of available local jobs
 */
export function getLocalJobsCount(): number {
  if (!cachedJobs) {
    cachedJobs = shuffle(loadAllLocalJobs());
  }
  return cachedJobs.length;
}
