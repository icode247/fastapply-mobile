// Swiped Jobs Cache Service - Stores job details for all swiped jobs
// Used to enrich backend records that may not have job details yet

import { storage } from "../utils/storage";

const STORAGE_KEY = "swiped_jobs_cache";

export interface SwipedJobDetails {
  url: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  platform: string;
  swipedAt: number;
}

// In-memory cache for faster access
let memoryCache: Record<string, SwipedJobDetails> = {};
let isLoaded = false;

/**
 * Load cache from storage into memory
 */
async function loadCache(): Promise<void> {
  if (isLoaded) return;

  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (stored) {
      memoryCache = JSON.parse(stored);
    }
    isLoaded = true;
  } catch (error) {
    console.error("Failed to load swiped jobs cache:", error);
    memoryCache = {};
    isLoaded = true;
  }
}

/**
 * Save cache to storage
 */
async function saveCache(): Promise<void> {
  try {
    await storage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch (error) {
    console.error("Failed to save swiped jobs cache:", error);
  }
}

/**
 * Add or update a swiped job in the cache
 */
export async function cacheSwipedJob(job: SwipedJobDetails): Promise<void> {
  await loadCache();
  memoryCache[job.url] = job;
  await saveCache();
}

/**
 * Add multiple swiped jobs to the cache
 */
export async function cacheSwipedJobs(jobs: SwipedJobDetails[]): Promise<void> {
  await loadCache();
  for (const job of jobs) {
    memoryCache[job.url] = job;
  }
  await saveCache();
}

/**
 * Get cached job details by URL
 */
export async function getCachedJob(url: string): Promise<SwipedJobDetails | null> {
  await loadCache();
  return memoryCache[url] || null;
}

/**
 * Get all cached jobs
 */
export async function getAllCachedJobs(): Promise<Record<string, SwipedJobDetails>> {
  await loadCache();
  return { ...memoryCache };
}

/**
 * Get cached job details by URL (sync version, must call loadCache first)
 */
export function getCachedJobSync(url: string): SwipedJobDetails | null {
  return memoryCache[url] || null;
}

/**
 * Ensure cache is loaded (call before using sync methods)
 */
export async function ensureCacheLoaded(): Promise<void> {
  await loadCache();
}

/**
 * Clear old entries (older than 30 days)
 */
export async function cleanupOldEntries(): Promise<void> {
  await loadCache();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  let hasChanges = false;
  for (const [url, job] of Object.entries(memoryCache)) {
    if (job.swipedAt < thirtyDaysAgo) {
      delete memoryCache[url];
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await saveCache();
  }
}

/**
 * Clear all cached jobs
 */
export async function clearCache(): Promise<void> {
  memoryCache = {};
  isLoaded = true;
  await storage.removeItem(STORAGE_KEY);
}

export const swipedJobsCacheService = {
  cacheSwipedJob,
  cacheSwipedJobs,
  getCachedJob,
  getAllCachedJobs,
  getCachedJobSync,
  ensureCacheLoaded,
  cleanupOldEntries,
  clearCache,
};

export default swipedJobsCacheService;
