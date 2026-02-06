import { create } from "zustand";
import { authService, profileService } from "../services";
import { setSessionExpiredHandler } from "../services/api";
import { AuthTokens, JobProfile, User } from "../types";
import { logger } from "../utils/logger";
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
  setUser: (user: User | null) => Promise<void>;
  setTokens: (tokens: AuthTokens | null) => Promise<void>;
  setPrimaryJobProfile: (profile: JobProfile | null) => Promise<void>;
  setHasCompletedOnboarding: (completed: boolean) => Promise<void>;
  login: (
    tokens: AuthTokens,
    user: User,
    primaryJobProfile: JobProfile | null
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Initialization guard — prevents concurrent initialize() calls
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  tokens: null,
  primaryJobProfile: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  hasCompletedOnboarding: false,

  // Initialize auth state from storage — guarded against concurrent calls
  initialize: async () => {
    // If already initialized, skip
    if (get().isInitialized) return;

    // If already initializing, return the existing promise
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      try {
        set({ isLoading: true });

        // Register session expiration handler
        setSessionExpiredHandler(() => {
          logger.info("Session expired, logging out...");
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
              logger.warn("Failed to fetch primary profile:", error);
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
          get().refreshUser().catch((e) => logger.warn("Background refresh failed:", e));
        }
      } catch (error) {
        logger.error("Error initializing auth:", error);
        // Clear potentially corrupted state
        await storage.clearAll();
      } finally {
        set({ isLoading: false, isInitialized: true });
        initializePromise = null;
      }
    })();

    return initializePromise;
  },

  setUser: async (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      await storage.setUser(user);
    } else {
      await storage.clearUser();
    }
  },

  setTokens: async (tokens) => {
    set({ tokens });
    if (tokens) {
      await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    } else {
      await storage.clearTokens();
    }
  },

  setPrimaryJobProfile: async (profile) => {
    set({ primaryJobProfile: profile });
    if (profile) {
      await storage.setPrimaryJobProfile(profile);
    } else {
      await storage.clearPrimaryJobProfile();
    }
  },

  setHasCompletedOnboarding: async (completed) => {
    set({ hasCompletedOnboarding: completed });
    await storage.setOnboardingComplete(completed);
  },

  login: async (tokens, user, primaryJobProfile) => {
    // Persist tokens first, then user — ensures storage completes before state update
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    await storage.setUser(user);

    if (primaryJobProfile) {
      await storage.setPrimaryJobProfile(primaryJobProfile);
    }

    const hasProfile = primaryJobProfile !== null;
    await storage.setOnboardingComplete(hasProfile);

    // Only update Zustand state after all storage writes succeed
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
      logger.warn("Logout API failed:", error);
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
      logger.warn("Failed to refresh user:", error);
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
