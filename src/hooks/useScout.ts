// useScout - Global orchestration hook for Scout voice assistant
// Flow: listen → think → speak → (action? dismiss : listen again) → ...

import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import {
  scoutAIService,
  scoutTTSService,
  speechToTextService,
  voiceRecordingService,
  wakeWordService,
} from "../services/voice";
import { useScoutStore } from "../stores/scout.store";
import { logger } from "../utils/logger";

// How long to wait for the user to start speaking before closing
const NO_SPEECH_TIMEOUT_MS = 7000;

export function useScout() {
  const store = useScoutStore();
  const abortRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);
  const hasSpokenRef = useRef(false);
  const noSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOverlayVisible = useRef(false);

  // Warm up TTS cache on mount
  useEffect(() => {
    scoutTTSService.warmupCache();
  }, []);

  const activateRef = useRef<() => void>(() => {});

  // Set up wake word listener
  useEffect(() => {
    if (wakeWordService.isEnabled()) {
      wakeWordService.onWakeWordDetected(() => {
        activateRef.current();
      });
      wakeWordService.start().then((started) => {
        if (!started) {
          logger.warn(
            "Wake word: could not start. Requires a development build. Use the button instead.",
          );
        }
      });
    }

    return () => {
      wakeWordService.stop();
    };
  }, []);

  // Cleanup when overlay closes (close button, auto-dismiss, or Android back)
  useEffect(() => {
    if (prevOverlayVisible.current && !store.isOverlayVisible) {
      // Overlay just closed — run full cleanup
      abortRef.current?.abort();
      abortRef.current = null;
      isProcessingRef.current = false;
      hasSpokenRef.current = false;
      if (noSpeechTimerRef.current) {
        clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
      voiceRecordingService.cancelRecording();
      scoutTTSService.stop();
      restartWakeWord();
    }
    prevOverlayVisible.current = store.isOverlayVisible;
  }, [store.isOverlayVisible]);

  /**
   * Clear the no-speech timeout
   */
  const clearNoSpeechTimer = useCallback(() => {
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
  }, []);

  /**
   * Start a recording session. Returns true if recording started.
   * Starts a no-speech timer — if the user doesn't speak within the window, dismiss.
   */
  const startListening = useCallback(async (): Promise<boolean> => {
    hasSpokenRef.current = false;
    useScoutStore.getState().setPhase("listening");

    // Start a timer: if user doesn't speak within the window, close
    clearNoSpeechTimer();
    noSpeechTimerRef.current = setTimeout(async () => {
      if (!hasSpokenRef.current && !isProcessingRef.current) {
        logger.debug("Scout: no speech detected, closing");
        await voiceRecordingService.cancelRecording();
        useScoutStore.getState().setPhase("done");
      }
    }, NO_SPEECH_TIMEOUT_MS);

    const started = await voiceRecordingService.startRecording({
      maxDuration: 20000,
      silenceThresholdMs: 3000,
      onSilenceDetected: () => {
        if (hasSpokenRef.current) {
          clearNoSpeechTimer();
          handleSilenceDetected();
        }
      },
      onMeteringUpdate: (level) => {
        useScoutStore.getState().setAudioLevel(level);
        // Normalized: 0.58 = -25dB, 0.5 = -30dB, 0.42 = -35dB
        // Require level above 0.58 (~-25dB) to confirm actual speech, not ambient noise
        if (level > 0.58) {
          hasSpokenRef.current = true;
          // User started speaking — cancel the no-speech timer
          clearNoSpeechTimer();
        }
      },
    });

    return started;
  }, []);

  /**
   * Activate Scout: show overlay, start recording
   */
  const activate = useCallback(async () => {
    if (useScoutStore.getState().isOverlayVisible || isProcessingRef.current)
      return;

    if (wakeWordService.isEnabled()) {
      await wakeWordService.stop();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    useScoutStore.getState().activate();

    const started = await startListening();

    if (!started) {
      useScoutStore.getState().setError("Microphone permission required");
      useScoutStore.getState().deactivate();
      restartWakeWord();
    }
  }, []);

  activateRef.current = activate;

  const restartWakeWord = useCallback(() => {
    if (wakeWordService.isEnabled()) {
      setTimeout(() => {
        wakeWordService.start();
      }, 500);
    }
  }, []);

  /**
   * Handle silence after speech: process the recording.
   * After Scout speaks back:
   *   - action dispatched → phase "done" → overlay auto-dismisses
   *   - no action (follow-up) → start listening again
   */
  const handleSilenceDetected = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const result = await voiceRecordingService.stopRecording();

      if (result.isSilent || !result.success || !result.uri) {
        useScoutStore.getState().setPhase("done");
        isProcessingRef.current = false;
        return;
      }

      // Thinking
      useScoutStore.getState().setPhase("thinking");
      useScoutStore.getState().setAudioLevel(0);

      const transcription = await speechToTextService.transcribeJobCommand(
        result.uri,
      );
      voiceRecordingService.deleteRecording(result.uri);

      if (!transcription.text) {
        useScoutStore.getState().setPhase("speaking");
        await scoutTTSService.speakCached("no_understand");
        // Listen again after "didn't catch that"
        isProcessingRef.current = false;
        await startListening();
        return;
      }

      useScoutStore.getState().setTranscript(transcription.text);

      // AI processing
      abortRef.current = new AbortController();
      const aiResponse = await scoutAIService.process(
        transcription.text,
        undefined,
        abortRef.current.signal,
      );

      // Speak the response
      useScoutStore.getState().setPhase("speaking");
      await scoutTTSService.speak(aiResponse.response);

      if (aiResponse.action.type !== "none") {
        // Action dispatched → done → overlay will auto-dismiss
        useScoutStore.getState().setPendingAction(aiResponse.action);
        useScoutStore.getState().setPhase("done");
      } else {
        // Follow-up question — listen again for user's reply
        isProcessingRef.current = false;
        await startListening();
        return;
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        logger.debug("Scout: processing aborted");
      } else {
        logger.error("Scout: processing error:", error);
        useScoutStore.getState().setPhase("speaking");
        await scoutTTSService.speakCached("sorry");
        useScoutStore.getState().setPhase("done");
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  /**
   * Deactivate: cancel everything, close overlay
   */
  const deactivate = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    isProcessingRef.current = false;
    hasSpokenRef.current = false;
    clearNoSpeechTimer();

    await voiceRecordingService.cancelRecording();
    await scoutTTSService.stop();

    useScoutStore.getState().deactivate();
    restartWakeWord();
  }, []);

  return {
    activate,
    deactivate,
    isOverlayVisible: store.isOverlayVisible,
    phase: store.phase,
    wakeWordActive: wakeWordService.isEnabled(),
  };
}
