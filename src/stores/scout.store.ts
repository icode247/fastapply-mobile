import { create } from "zustand";
import { ScoutAction, ScoutPhase } from "../types/voice.types";

interface ScoutState {
  // State
  isOverlayVisible: boolean;
  phase: ScoutPhase;
  transcript: string;
  responseText: string;
  audioLevel: number; // 0-1 for orb animation
  pendingAction: ScoutAction | null;
  error: string | null;

  // Actions
  activate: () => void;
  deactivate: () => void;
  setPhase: (phase: ScoutPhase) => void;
  setTranscript: (transcript: string) => void;
  setResponseText: (text: string) => void;
  setAudioLevel: (level: number) => void;
  setPendingAction: (action: ScoutAction) => void;
  clearPendingAction: () => void;
  setError: (error: string | null) => void;
}

export const useScoutStore = create<ScoutState>((set) => ({
  isOverlayVisible: false,
  phase: "idle",
  transcript: "",
  responseText: "",
  audioLevel: 0,
  pendingAction: null,
  error: null,

  activate: () =>
    set({
      isOverlayVisible: true,
      phase: "listening",
      transcript: "",
      responseText: "",
      error: null,
    }),

  deactivate: () =>
    set({
      isOverlayVisible: false,
      phase: "idle",
      transcript: "",
      responseText: "",
      audioLevel: 0,
      error: null,
    }),

  setPhase: (phase) => set({ phase }),
  setTranscript: (transcript) => set({ transcript }),
  setResponseText: (responseText) => set({ responseText }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  setPendingAction: (pendingAction) => set({ pendingAction }),
  clearPendingAction: () => set({ pendingAction: null }),

  setError: (error) => set({ error }),
}));
