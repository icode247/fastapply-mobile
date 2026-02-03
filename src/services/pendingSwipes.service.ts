// Pending Swipes Service - Read-only access to pending swiped jobs
// Used by the applications screen to show jobs waiting to be queued

import { storage } from "../utils/storage";

const STORAGE_KEY = "swipe_batch_pending_jobs";

export interface PendingSwipedJob {
  id: string;
  url: string;
  title: string;
  company: string;
  platform: string;
  swipedAt: number;
}

/**
 * Get all pending swiped jobs from storage
 */
export async function getPendingSwipedJobs(): Promise<PendingSwipedJob[]> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PendingSwipedJob[];
    }
    return [];
  } catch (error) {
    console.error("Failed to get pending swiped jobs:", error);
    return [];
  }
}

/**
 * Get count of pending swiped jobs
 */
export async function getPendingSwipedJobsCount(): Promise<number> {
  const jobs = await getPendingSwipedJobs();
  return jobs.length;
}

export const pendingSwipesService = {
  getPendingSwipedJobs,
  getPendingSwipedJobsCount,
};

export default pendingSwipesService;
