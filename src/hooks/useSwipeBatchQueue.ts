// useSwipeBatchQueue Hook - Batches swiped jobs and sends to automation after inactivity
// When user swipes right, jobs are kept pending. After 2 minutes of no swiping,
// all pending URLs are batched and sent to create an automation.

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../utils/logger";
import { ENDPOINTS } from "../constants/api";
import api, { getApiErrorMessage } from "../services/api";
import { cacheSwipedJob, SwipedJobDetails } from "../services/swipedJobsCache.service";
import { Automation, CreateAutomationDto } from "../types/automation.types";
import { NormalizedJob } from "../types/job.types";
import { storage } from "../utils/storage";

// Storage key for persisting pending swipes
const STORAGE_KEY = "swipe_batch_pending_jobs";

// Debounce timeout in milliseconds (1 minute)
const BATCH_DEBOUNCE_MS = 1 * 60 * 1000;

// Resume settings interface
export interface ResumeSettings {
  useTailoredResume: boolean;
  resumeType: "pdf" | "docx" | null;
  resumeTemplate: string | null;
}

// Interface for a pending swiped job
export interface PendingSwipedJob {
  id: string;
  url: string;
  title: string;
  company: string;
  platform: string;
  swipedAt: number;
}

interface UseSwipeBatchQueueOptions {
  profileId: string | null;
  profileName?: string;
  resumeSettings?: ResumeSettings;
  onBatchSent?: (automation: Automation, jobCount: number) => void;
  onBatchError?: (error: string) => void;
}

interface UseSwipeBatchQueueReturn {
  // State
  pendingJobs: PendingSwipedJob[];
  isSending: boolean;
  lastError: string | null;
  timeUntilBatch: number | null; // ms until batch is sent, null if no pending jobs

  // Actions
  addSwipedJob: (job: NormalizedJob) => void;
  clearPendingJobs: () => void;
  forceSendBatch: () => Promise<void>;
  flushAndReset: () => Promise<void>; // Send pending jobs and clear for new settings
}

/**
 * Hook for batching swiped jobs and sending to automation after inactivity
 */
export function useSwipeBatchQueue(
  options: UseSwipeBatchQueueOptions
): UseSwipeBatchQueueReturn {
  const { profileId, profileName, resumeSettings, onBatchSent, onBatchError } = options;

  // State
  const [pendingJobs, setPendingJobs] = useState<PendingSwipedJob[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [timeUntilBatch, setTimeUntilBatch] = useState<number | null>(null);

  // Refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);
  const profileIdRef = useRef(profileId);
  const profileNameRef = useRef(profileName);
  const resumeSettingsRef = useRef(resumeSettings);

  // Keep refs updated
  profileIdRef.current = profileId;
  profileNameRef.current = profileName;
  resumeSettingsRef.current = resumeSettings;

  // Track if pending jobs have been loaded from storage
  const pendingJobsLoadedRef = useRef(false);
  const pendingJobsToSendRef = useRef<PendingSwipedJob[] | null>(null);

  // Load pending jobs from storage on mount
  useEffect(() => {
    const loadPendingJobs = async () => {
      try {
        const stored = await storage.getItem(STORAGE_KEY);
        if (stored) {
          const jobs: PendingSwipedJob[] = JSON.parse(stored);
          if (jobs.length > 0) {
            setPendingJobs(jobs);
            // If there are pending jobs, start the timer from the last swipe time
            const lastSwipe = Math.max(...jobs.map((j) => j.swipedAt));
            const elapsed = Date.now() - lastSwipe;
            const remaining = BATCH_DEBOUNCE_MS - elapsed;

            if (remaining > 0) {
              lastSwipeTimeRef.current = lastSwipe;
              startDebounceTimer(remaining);
            } else {
              // Timer already expired - but profile may not be selected yet
              // Store jobs for later send when profile becomes available
              pendingJobsToSendRef.current = jobs;
            }
          }
        }
      } catch (error) {
        logger.error("Failed to load pending swipes:", error);
      }
      pendingJobsLoadedRef.current = true;
    };

    loadPendingJobs();

    return () => {
      // Cleanup timers on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Save pending jobs to storage whenever they change
  useEffect(() => {
    const savePendingJobs = async () => {
      try {
        await storage.setItem(STORAGE_KEY, JSON.stringify(pendingJobs));
      } catch (error) {
        logger.error("Failed to save pending swipes:", error);
      }
    };

    savePendingJobs();
  }, [pendingJobs]);

  /**
   * Start the debounce timer
   */
  const startDebounceTimer = useCallback((duration: number) => {
    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Set initial countdown
    setTimeUntilBatch(duration);

    // Start countdown interval (update every second)
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastSwipeTimeRef.current;
      const remaining = Math.max(0, BATCH_DEBOUNCE_MS - elapsed);
      setTimeUntilBatch(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      }
    }, 1000);

    // Set the main debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setTimeUntilBatch(null);

      // Get current pending jobs from state via callback
      setPendingJobs((currentJobs) => {
        if (currentJobs.length > 0) {
          sendBatch(currentJobs);
        }
        return currentJobs;
      });
    }, duration);
  }, []);

  /**
   * Send batch of jobs to create automation
   */
  const sendBatch = useCallback(
    async (jobs: PendingSwipedJob[]) => {
      const currentProfileId = profileIdRef.current;
      const currentProfileName = profileNameRef.current;
      const currentResumeSettings = resumeSettingsRef.current;

      if (!currentProfileId) {
        const error = "No profile selected. Please select a profile first.";
        setLastError(error);
        onBatchError?.(error);
        return;
      }

      if (jobs.length === 0) {
        return;
      }

      setIsSending(true);
      setLastError(null);

      try {
        // Extract URLs from pending jobs
        const jobUrls = jobs.map((job) => job.url);

        // Create automation payload matching the expected format
        const automationName = currentProfileName
          ? `${currentProfileName} - Job Applications`
          : `My Daily Job Applications`;

        // Calculate schedule time as 1 minute from now
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        const scheduleTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        // Build payload with resume settings if enabled
        const payload: Record<string, unknown> = {
          name: automationName,
          jobProfileId: currentProfileId,
          applicationMode: "direct_urls",
          maxApplicationsPerDay: 10,
          scheduleType: "daily",
          scheduleTime: scheduleTime,
          jobUrls: jobUrls,
          isActive: true,
        };

        // Add resume settings if tailored resume is enabled
        if (currentResumeSettings?.useTailoredResume) {
          payload.useTailoredResume = true;
          if (currentResumeSettings.resumeType) {
            payload.resumeType = currentResumeSettings.resumeType;
          }
          if (currentResumeSettings.resumeTemplate) {
            payload.resumeTemplate = currentResumeSettings.resumeTemplate;
          }
        } else {
          payload.useTailoredResume = false;
        }

        logger.debug("=== BATCH: Creating automation with swiped jobs ===");
        logger.debug("Payload:", JSON.stringify(payload, null, 2));

        const response = await api.post<Automation>(
          ENDPOINTS.AUTOMATIONS.BASE,
          payload
        );

        logger.debug("Automation created:", response.data.id);

        // Clear pending jobs on success
        setPendingJobs([]);
        await storage.removeItem(STORAGE_KEY);

        onBatchSent?.(response.data, jobs.length);
      } catch (error) {
        const errorMsg = getApiErrorMessage(error);
        logger.error("Failed to create automation batch:", errorMsg);
        setLastError(errorMsg);
        onBatchError?.(errorMsg);
      } finally {
        setIsSending(false);
      }
    },
    [onBatchSent, onBatchError]
  );

  // Send deferred batch when profile becomes available
  useEffect(() => {
    if (profileId && pendingJobsToSendRef.current && pendingJobsToSendRef.current.length > 0) {
      const jobsToSend = pendingJobsToSendRef.current;
      pendingJobsToSendRef.current = null; // Clear ref to prevent double-send
      logger.debug("Profile now available, sending deferred batch:", jobsToSend.length, "jobs");
      sendBatch(jobsToSend);
    }
  }, [profileId, sendBatch]);

  /**
   * Add a swiped job to the pending queue
   */
  const addSwipedJob = useCallback(
    (job: NormalizedJob) => {
      const url = job.applyUrl || job.listingUrl;

      if (!url) {
        logger.warn("Job has no URL, skipping:", job.title);
        return;
      }

      const swipedAt = Date.now();

      const pendingJob: PendingSwipedJob = {
        id: job.id,
        url: url,
        title: job.title,
        company: job.company,
        platform: job.source,
        swipedAt: swipedAt,
      };

      // Cache job details permanently for future display
      const cachedJob: SwipedJobDetails = {
        url: url,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        platform: job.source,
        swipedAt: swipedAt,
      };
      cacheSwipedJob(cachedJob).catch((err) =>
        logger.error("Failed to cache swiped job:", err)
      );

      // Add to pending jobs (avoid duplicates)
      setPendingJobs((prev) => {
        const exists = prev.some((p) => p.url === url);
        if (exists) {
          logger.debug("Job already in pending queue:", job.title);
          return prev;
        }
        logger.debug("Added job to pending queue:", job.title);
        return [...prev, pendingJob];
      });

      // Update last swipe time and reset debounce timer
      lastSwipeTimeRef.current = Date.now();
      startDebounceTimer(BATCH_DEBOUNCE_MS);
    },
    [startDebounceTimer]
  );

  /**
   * Clear all pending jobs
   */
  const clearPendingJobs = useCallback(async () => {
    // Clear timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setPendingJobs([]);
    setTimeUntilBatch(null);
    await storage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Force send the batch immediately (without waiting for debounce)
   */
  const forceSendBatch = useCallback(async () => {
    // Clear timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setTimeUntilBatch(null);

    // Send current pending jobs
    await sendBatch(pendingJobs);
  }, [pendingJobs, sendBatch]);

  /**
   * Flush pending jobs and reset for new settings
   * Call this when profile or resume settings change
   */
  const flushAndReset = useCallback(async () => {
    // Clear timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setTimeUntilBatch(null);

    // Send any pending jobs with the OLD settings before they change
    if (pendingJobs.length > 0) {
      await sendBatch(pendingJobs);
    }

    // Clear local state (already done in sendBatch on success, but ensure clean state)
    setPendingJobs([]);
    await storage.removeItem(STORAGE_KEY);
  }, [pendingJobs, sendBatch]);

  return {
    pendingJobs,
    isSending,
    lastError,
    timeUntilBatch,
    addSwipedJob,
    clearPendingJobs,
    forceSendBatch,
    flushAndReset,
  };
}

export default useSwipeBatchQueue;
