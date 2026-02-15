import { create } from "zustand";
import {
  DEFAULT_JOB_PREFERENCES,
  JobPreferencesFormValues,
} from "../components/feed/JobPreferencesForm";
import { logger } from "../utils/logger";
import { storage } from "../utils/storage";

const STORAGE_KEY = "fastapply_job_preferences";

interface PreferencesState {
  preferences: JobPreferencesFormValues;
  isLoaded: boolean;

  /** Load preferences from AsyncStorage on app start */
  initialize: () => Promise<void>;

  /** Update preferences in memory and persist to AsyncStorage */
  setPreferences: (preferences: JobPreferencesFormValues) => Promise<void>;

  /** Reset preferences to defaults */
  resetPreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: { ...DEFAULT_JOB_PREFERENCES },
  isLoaded: false,

  initialize: async () => {
    if (get().isLoaded) return;
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JobPreferencesFormValues;
        set({ preferences: parsed, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      logger.error("Failed to load job preferences:", error);
      set({ isLoaded: true });
    }
  },

  setPreferences: async (preferences) => {
    set({ preferences });
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      logger.error("Failed to save job preferences:", error);
    }
  },

  resetPreferences: async () => {
    const defaults = { ...DEFAULT_JOB_PREFERENCES };
    set({ preferences: defaults });
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch (error) {
      logger.error("Failed to reset job preferences:", error);
    }
  },
}));

export default usePreferencesStore;
