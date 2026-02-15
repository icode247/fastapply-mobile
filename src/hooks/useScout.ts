// useScout - Global orchestration hook for Scout voice assistant
// Wires together: recording -> STT -> AI -> TTS -> action dispatch

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

export function useScout() {
  const store = useScoutStore();
  const abortRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);

  // Warm up TTS cache on mount
  useEffect(() => {
    scoutTTSService.warmupCache();
  }, []);

  // Set up wake word listener
  useEffect(() => {
    if (wakeWordService.isEnabled()) {
      wakeWordService.onWakeWordDetected(() => {
        activate();
      });
      wakeWordService.start();
    }

    return () => {
      wakeWordService.stop();
    };
  }, []);

  /**
   * Activate Scout: show overlay, play acknowledgment, start recording
   */
  const activate = useCallback(async () => {
    if (store.isOverlayVisible || isProcessingRef.current) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Show overlay + set phase
    store.activate();

    // Start recording FIRST — TTS playback conflicts with iOS audio mode
    // (allowsRecordingIOS must be true during recording, but TTS sets it to false)
    const started = await voiceRecordingService.startRecording({
      maxDuration: 15000,
      silenceThresholdMs: 2000,
      onSilenceDetected: () => {
        handleSilenceDetected();
      },
      onMeteringUpdate: (level) => {
        store.setAudioLevel(level);
      },
    });

    if (!started) {
      store.setError("Microphone permission required");
      store.deactivate();
    }
  }, [store.isOverlayVisible]);

  /**
   * Handle silence detected: stop recording and process
   */
  const handleSilenceDetected = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Stop recording
      const result = await voiceRecordingService.stopRecording();

      // If silent/empty, just close
      if (result.isSilent || !result.success || !result.uri) {
        store.deactivate();
        isProcessingRef.current = false;
        return;
      }

      // Move to thinking phase
      store.setPhase("thinking");
      store.setAudioLevel(0);

      // Transcribe
      const transcription = await speechToTextService.transcribeJobCommand(
        result.uri,
      );

      // Clean up recording file
      voiceRecordingService.deleteRecording(result.uri);

      if (!transcription.text) {
        store.setResponseText("I didn't catch that.");
        store.setPhase("speaking");
        await scoutTTSService.speakCached("no_understand");
        store.setPhase("done");
        isProcessingRef.current = false;
        return;
      }

      store.setTranscript(transcription.text);

      // Process through AI
      abortRef.current = new AbortController();
      const aiResponse = await scoutAIService.process(
        transcription.text,
        undefined, // context can be passed here
        abortRef.current.signal,
      );

      // Set response text and speak it
      store.setResponseText(aiResponse.response);
      store.setPhase("speaking");

      // Dispatch action immediately (don't wait for speech)
      if (aiResponse.action.type !== "none") {
        store.setPendingAction(aiResponse.action);
      }

      // Speak the response
      await scoutTTSService.speak(aiResponse.response);

      // Done
      store.setPhase("done");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        logger.debug("Scout: processing aborted");
      } else {
        logger.error("Scout: processing error:", error);
        store.setResponseText("Sorry, something went wrong.");
        store.setPhase("speaking");
        await scoutTTSService.speakCached("sorry");
        store.setPhase("done");
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

    await voiceRecordingService.cancelRecording();
    await scoutTTSService.stop();

    store.deactivate();
  }, []);

  return {
    activate,
    deactivate,
    isOverlayVisible: store.isOverlayVisible,
    phase: store.phase,
    wakeWordActive: wakeWordService.isEnabled(),
  };
}
