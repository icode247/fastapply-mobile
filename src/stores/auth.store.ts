import { create } from "zustand";
import { authService, profileService } from "../services";
import { setSessionExpiredHandler } from "../services/api";
import { AuthTokens, JobProfile, User } from "../types";
import { storage } from "../utils/storage";

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  primaryJobProfile: JobProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  hasCompletedOnboarding: boolean;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setPrimaryJobProfile: (profile: JobProfile | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  login: (
    tokens: AuthTokens,
    user: User,
    primaryJobProfile: JobProfile | null
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  tokens: null,
  primaryJobProfile: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  hasCompletedOnboarding: false,

  // Initialize auth state from storage
  initialize: async () => {
    try {
      set({ isLoading: true });

      // Register session expiration handler
      setSessionExpiredHandler(() => {
        console.log("Session expired, logging out...");
        get().logout();
      });

      const [accessToken, user, storedProfile] = await Promise.all([
        storage.getAccessToken(),
        storage.getUser<User>(),
        storage.getPrimaryJobProfile<JobProfile>(),
      ]);

      if (accessToken && user) {
        let primaryJobProfile = storedProfile;

        // If no profile in storage, try fetching from API (migration for existing sessions)
        if (!primaryJobProfile) {
          try {
            primaryJobProfile = await profileService.getPrimaryProfile();
            if (primaryJobProfile) {
              await storage.setPrimaryJobProfile(primaryJobProfile);
            }
          } catch (error) {
            console.warn("Failed to fetch primary profile:", error);
          }
        }

        // Determine onboarding completion based on profile existence
        const hasCompletedOnboarding = primaryJobProfile !== null;

        // Sync storage if it was out of date
        await storage.setOnboardingComplete(hasCompletedOnboarding);

        set({
          user,
          primaryJobProfile,
          isAuthenticated: true,
          hasCompletedOnboarding,
        });

        // Optionally refresh user data in background
        get().refreshUser().catch(console.warn);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      // Clear potentially corrupted state
      await storage.clearAll();
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      storage.setUser(user);
    } else {
      storage.clearUser();
    }
  },

  setTokens: (tokens) => {
    set({ tokens });
    if (tokens) {
      storage.setTokens(tokens.accessToken, tokens.refreshToken);
    } else {
      storage.clearTokens();
    }
  },

  setPrimaryJobProfile: (profile) => {
    set({ primaryJobProfile: profile });
    if (profile) {
      storage.setPrimaryJobProfile(profile);
    } else {
      storage.clearPrimaryJobProfile();
    }
  },

  setHasCompletedOnboarding: (completed) => {
    set({ hasCompletedOnboarding: completed });
    storage.setOnboardingComplete(completed);
  },

  login: async (tokens, user, primaryJobProfile) => {
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    await storage.setUser(user);

    // Store primary job profile if it exists
    if (primaryJobProfile) {
      await storage.setPrimaryJobProfile(primaryJobProfile);
    }

    // Determine onboarding status based on whether a profile exists
    const hasProfile = primaryJobProfile !== null;
    await storage.setOnboardingComplete(hasProfile);

    set({
      user,
      tokens,
      primaryJobProfile,
      isAuthenticated: true,
      hasCompletedOnboarding: hasProfile,
    });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout API failed:", error);
    }

    await storage.clearAll();

    set({
      user: null,
      tokens: null,
      primaryJobProfile: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
    });
  },

  refreshUser: async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user });
      await storage.setUser(user);
    } catch (error) {
      console.warn("Failed to refresh user:", error);
      // If token is invalid, logout
      if (
        (error as { response?: { status?: number } })?.response?.status === 401
      ) {
        await get().logout();
      }
    }
  },
}));

export default useAuthStore;
