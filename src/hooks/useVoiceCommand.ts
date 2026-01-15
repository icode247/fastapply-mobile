// useVoiceCommand Hook - React hook for voice command functionality

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Vibration } from "react-native";
import { NormalizedJob } from "../types/job.types";
import { JobProfile } from "../types/profile.types";
import {
  ParsedVoiceCommand,
  VoiceCommandResult,
  VoiceRecordingState,
} from "../types/voice.types";
import {
  voiceCommandService,
  voiceRecordingService,
  speechToTextService,
  voiceCommandParserService,
} from "../services/voice";

export interface UseVoiceCommandOptions {
  jobs?: NormalizedJob[];
  currentJobIndex?: number;
  profile?: JobProfile | null;
  onApply?: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
  onNext?: () => void;
  onSearch?: (jobs: NormalizedJob[]) => void;
  onFilter?: (jobs: NormalizedJob[]) => void;
  onDetails?: () => void;
  onError?: (error: string) => void;
  hapticFeedback?: boolean;
}

export interface UseVoiceCommandReturn {
  // State
  isListening: boolean;
  isProcessing: boolean;
  lastCommand: ParsedVoiceCommand | null;
  lastResult: VoiceCommandResult | null;
  error: string | null;
  isConfigured: boolean;

  // Actions
  startListening: () => Promise<boolean>;
  stopListening: () => Promise<VoiceCommandResult | null>;
  cancelListening: () => Promise<void>;
  processTextCommand: (text: string) => Promise<VoiceCommandResult | null>;

  // Utilities
  requestPermissions: () => Promise<boolean>;
  hasPermissions: () => Promise<boolean>;
}

export function useVoiceCommand(
  options: UseVoiceCommandOptions = {}
): UseVoiceCommandReturn {
  const {
    jobs = [],
    currentJobIndex = 0,
    profile = null,
    onApply,
    onSkip,
    onUndo,
    onNext,
    onSearch,
    onFilter,
    onDetails,
    onError,
    hapticFeedback = true,
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<ParsedVoiceCommand | null>(
    null
  );
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent stale closures
  const jobsRef = useRef(jobs);
  const currentJobIndexRef = useRef(currentJobIndex);
  const profileRef = useRef(profile);

  // Update refs when props change
  useEffect(() => {
    jobsRef.current = jobs;
    voiceCommandService.setJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    currentJobIndexRef.current = currentJobIndex;
    voiceCommandService.setCurrentJobIndex(currentJobIndex);
  }, [currentJobIndex]);

  useEffect(() => {
    profileRef.current = profile;
    voiceCommandService.setUserProfile(profile);
  }, [profile]);

  // Check if services are configured
  const isConfigured =
    speechToTextService.isConfigured() &&
    voiceCommandParserService.isConfigured();

  /**
   * Handle command execution based on intent
   */
  const handleCommandResult = useCallback(
    (result: VoiceCommandResult) => {
      if (!result.success) {
        setError(result.error || "Command failed");
        if (onError) {
          onError(result.error || "Command failed");
        }
        return;
      }

      // Haptic feedback on success
      if (hapticFeedback) {
        Vibration.vibrate(50);
      }

      const { intent } = result.command;

      switch (intent) {
        case "apply":
          if (result.command.params.applyToAll) {
            Alert.alert(
              "Auto-Apply",
              `Found ${result.matchedJobs || 0} matching jobs. Apply to all?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Apply to All",
                  onPress: () => {
                    // In production, would trigger bulk apply
                    Alert.alert(
                      "Success",
                      `Applied to ${result.appliedJobs || 0} jobs!`
                    );
                  },
                },
              ]
            );
          } else {
            onApply?.();
          }
          break;

        case "skip":
          onSkip?.();
          break;

        case "undo":
          onUndo?.();
          break;

        case "next":
          onNext?.();
          break;

        case "search":
          if (result.matchedJobs !== undefined) {
            Alert.alert(
              "Search Results",
              `Found ${result.matchedJobs} jobs matching "${result.command.rawText}"`
            );
            // Trigger search callback with filtered jobs
            // In a full implementation, would pass the actual filtered jobs
          }
          onSearch?.(jobsRef.current);
          break;

        case "filter":
          if (result.matchedJobs !== undefined) {
            Alert.alert(
              "Filter Applied",
              `${result.matchedJobs} jobs match your filter`
            );
          }
          onFilter?.(jobsRef.current);
          break;

        case "details":
          onDetails?.();
          break;

        case "help":
          Alert.alert(
            "Voice Commands",
            `Try saying:\n\n` +
              `• "Search for frontend jobs in USA"\n` +
              `• "Apply to this job"\n` +
              `• "Skip"\n` +
              `• "Apply to all jobs matching my profile"\n` +
              `• "Show me remote jobs"\n` +
              `• "Filter by senior level"\n` +
              `• "Undo"`,
            [{ text: "Got it" }]
          );
          break;

        default:
          Alert.alert(
            "Command Not Recognized",
            result.command.suggestion ||
              'Try saying "Search for [job type] in [location]"'
          );
      }
    },
    [
      hapticFeedback,
      onApply,
      onSkip,
      onUndo,
      onNext,
      onSearch,
      onFilter,
      onDetails,
      onError,
    ]
  );

  /**
   * Request microphone permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    return voiceRecordingService.requestPermissions();
  }, []);

  /**
   * Check if permissions are granted
   */
  const hasPermissions = useCallback(async (): Promise<boolean> => {
    return voiceRecordingService.hasPermissions();
  }, []);

  /**
   * Start listening for voice command
   */
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      const errorMsg = "Voice commands not configured. Please add OpenAI API key.";
      setError(errorMsg);
      Alert.alert("Configuration Required", errorMsg);
      return false;
    }

    setError(null);
    setLastCommand(null);
    setLastResult(null);

    const started = await voiceCommandService.startListening();

    if (started) {
      setIsListening(true);
      if (hapticFeedback) {
        Vibration.vibrate(100);
      }
    } else {
      const state = voiceCommandService.getSessionState();
      setError(state.recording.error || "Failed to start listening");
    }

    return started;
  }, [isConfigured, hapticFeedback]);

  /**
   * Stop listening and process command
   */
  const stopListening = useCallback(async (): Promise<VoiceCommandResult | null> => {
    if (!isListening) {
      return null;
    }

    setIsListening(false);
    setIsProcessing(true);

    if (hapticFeedback) {
      Vibration.vibrate(50);
    }

    try {
      const result = await voiceCommandService.stopListening();

      setIsProcessing(false);
      setLastCommand(result.command);
      setLastResult(result);

      handleCommandResult(result);

      return result;
    } catch (err) {
      setIsProcessing(false);
      const errorMsg = err instanceof Error ? err.message : "Processing failed";
      setError(errorMsg);
      return null;
    }
  }, [isListening, hapticFeedback, handleCommandResult]);

  /**
   * Cancel current listening session
   */
  const cancelListening = useCallback(async (): Promise<void> => {
    await voiceCommandService.cancelListening();
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  /**
   * Process a text command directly (for testing or fallback)
   */
  const processTextCommand = useCallback(
    async (text: string): Promise<VoiceCommandResult | null> => {
      if (!text.trim()) {
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await voiceCommandService.processTextCommand(text);

        setIsProcessing(false);
        setLastCommand(result.command);
        setLastResult(result);

        handleCommandResult(result);

        return result;
      } catch (err) {
        setIsProcessing(false);
        const errorMsg = err instanceof Error ? err.message : "Processing failed";
        setError(errorMsg);
        return null;
      }
    },
    [handleCommandResult]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceCommandService.cancelListening();
    };
  }, []);

  return {
    // State
    isListening,
    isProcessing,
    lastCommand,
    lastResult,
    error,
    isConfigured,

    // Actions
    startListening,
    stopListening,
    cancelListening,
    processTextCommand,

    // Utilities
    requestPermissions,
    hasPermissions,
  };
}

export default useVoiceCommand;
