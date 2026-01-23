// useAutomation Hook - Integration between swipe actions and automation service
// Provides a clean interface for the feed screen to queue jobs for automation

import { useCallback, useEffect, useRef, useState } from "react";
import { automationService } from "../services/automation.service";
import {
  Automation,
  AutomationQueueStats,
  UrlInput,
} from "../types/automation.types";
import { NormalizedJob } from "../types/job.types";

interface UseAutomationOptions {
  profileId: string | null;
  profileName?: string;
  onSuccess?: (job: NormalizedJob, automationId: string) => void;
  onError?: (job: NormalizedJob, error: string) => void;
  enableHaptics?: boolean;
}

interface UseAutomationReturn {
  // State
  isReady: boolean;
  isProcessing: boolean;
  currentAutomation: Automation | null;
  queueStats: AutomationQueueStats | null;
  pendingCount: number;
  lastError: string | null;

  // Actions
  queueJob: (job: NormalizedJob) => Promise<boolean>;
  queueJobByUrl: (
    url: string,
    jobDetails?: { title?: string; company?: string; platform?: string }
  ) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  syncPendingJobs: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing job automation queue from swipe actions
 */
export function useAutomation(
  options: UseAutomationOptions
): UseAutomationReturn {
  const { profileId, profileName, onSuccess, onError } = options;

  // State
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<Automation | null>(
    null
  );
  const [queueStats, setQueueStats] = useState<AutomationQueueStats | null>(
    null
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Refs for stable callbacks
  const profileIdRef = useRef(profileId);
  const profileNameRef = useRef(profileName);
  profileIdRef.current = profileId;
  profileNameRef.current = profileName;

  // Initialize service and load automation
  useEffect(() => {
    let mounted = true;

    const initializeAutomation = async () => {
      if (!profileId) {
        setIsReady(false);
        setCurrentAutomation(null);
        return;
      }

      try {
        await automationService.initialize();

        // Try to get existing automation (don't create - that happens on first swipe)
        const automation =
          await automationService.getAutomationForProfile(profileId);

        if (mounted) {
          setCurrentAutomation(automation);
          setPendingCount(automationService.getPendingUrlsCount());
          setIsReady(true);

          // Load queue stats if automation exists and has valid id
          if (automation?.id) {
            const stats = await automationService.getQueueStats(automation.id);
            if (mounted && stats) {
              setQueueStats(stats);
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize automation:", error);
        if (mounted) {
          setIsReady(true); // Still ready, just no automation yet
        }
      }
    };

    initializeAutomation();

    return () => {
      mounted = false;
    };
  }, [profileId, profileName]);

  /**
   * Queue a job for automation (called on swipe right)
   */
  const queueJob = useCallback(
    async (job: NormalizedJob): Promise<boolean> => {
      const currentProfileId = profileIdRef.current;

      if (!currentProfileId) {
        const errorMsg = "No profile selected";
        setLastError(errorMsg);
        onError?.(job, errorMsg);
        return false;
      }

      // Use apply URL, fallback to listing URL
      const jobUrl = job.applyUrl || job.listingUrl;

      if (!jobUrl) {
        const errorMsg = "Job has no application URL";
        setLastError(errorMsg);
        onError?.(job, errorMsg);
        return false;
      }

      setIsProcessing(true);
      setLastError(null);

      try {
        const result = await automationService.addJobToQueue(
          currentProfileId,
          jobUrl,
          {
            title: job.title,
            company: job.company,
            platform: job.source,
          },
          profileNameRef.current
        );

        if (result.success) {
          // Update state
          setPendingCount(automationService.getPendingUrlsCount());

          // Update automation reference if we don't have it
          if (!currentAutomation && result.automationId) {
            const automation = await automationService.getAutomation(
              result.automationId
            );
            setCurrentAutomation(automation);
          }

          onSuccess?.(job, result.automationId!);
          return true;
        } else {
          setLastError(result.error || "Failed to queue job");
          onError?.(job, result.error || "Failed to queue job");
          return false;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to queue job";
        setLastError(errorMsg);
        onError?.(job, errorMsg);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentAutomation, onSuccess, onError]
  );

  /**
   * Queue a job by URL directly (for manual URL input)
   */
  const queueJobByUrl = useCallback(
    async (
      url: string,
      jobDetails?: { title?: string; company?: string; platform?: string }
    ): Promise<boolean> => {
      const currentProfileId = profileIdRef.current;

      if (!currentProfileId) {
        setLastError("No profile selected");
        return false;
      }

      setIsProcessing(true);
      setLastError(null);

      try {
        const result = await automationService.addJobToQueue(
          currentProfileId,
          url,
          jobDetails,
          profileNameRef.current
        );

        if (result.success) {
          setPendingCount(automationService.getPendingUrlsCount());
          return true;
        } else {
          setLastError(result.error || "Failed to queue job");
          return false;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to queue job";
        setLastError(errorMsg);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * Refresh queue statistics
   */
  const refreshStats = useCallback(async () => {
    if (!currentAutomation) return;

    try {
      const stats = await automationService.getQueueStats(currentAutomation.id);
      if (stats) {
        setQueueStats(stats);
      }
      setPendingCount(automationService.getPendingUrlsCount());
    } catch (error) {
      console.error("Failed to refresh stats:", error);
    }
  }, [currentAutomation]);

  /**
   * Manually trigger sync of pending jobs
   */
  const syncPendingJobs = useCallback(async () => {
    try {
      await automationService.syncPendingUrls();
      setPendingCount(automationService.getPendingUrlsCount());
    } catch (error) {
      console.error("Failed to sync pending jobs:", error);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    isReady,
    isProcessing,
    currentAutomation,
    queueStats,
    pendingCount,
    lastError,
    queueJob,
    queueJobByUrl,
    refreshStats,
    syncPendingJobs,
    clearError,
  };
}

export default useAutomation;
