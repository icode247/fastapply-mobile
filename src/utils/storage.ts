import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "fastapply_access_token",
  REFRESH_TOKEN: "fastapply_refresh_token",
  USER: "fastapply_user",
  PRIMARY_JOB_PROFILE: "fastapply_primary_job_profile",
  ONBOARDING_COMPLETE: "fastapply_onboarding_complete",
  THEME: "fastapply_theme",
} as const;

// Keys that contain sensitive data and should use SecureStore (max 2048 bytes)
const SECURE_KEYS = new Set<string>([
  STORAGE_KEYS.ACCESS_TOKEN,
  STORAGE_KEYS.REFRESH_TOKEN,
]);

// For web, use localStorage fallback
const isWeb = Platform.OS === "web";

export const storage = {
  /**
   * Set item - uses SecureStore for sensitive keys, AsyncStorage for others
   * SecureStore has a 2048 byte limit, so non-sensitive large data uses AsyncStorage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Validate that value is a non-null string
      if (value === null || value === undefined) {
        console.warn(`Attempted to store null/undefined for ${key}, skipping`);
        return;
      }
      const stringValue = typeof value === "string" ? value : String(value);

      if (isWeb) {
        localStorage.setItem(key, stringValue);
      } else if (SECURE_KEYS.has(key)) {
        // Sensitive data - use SecureStore (has 2048 byte limit)
        await SecureStore.setItemAsync(key, stringValue);
      } else {
        // Non-sensitive data - use AsyncStorage (no size limit)
        await AsyncStorage.setItem(key, stringValue);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      if (SECURE_KEYS.has(key)) {
        return await SecureStore.getItemAsync(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else if (SECURE_KEYS.has(key)) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  // Token management
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  // User management
  async setUser(user: object): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    const userStr = await this.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as T;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER);
  },

  // Onboarding
  async setOnboardingComplete(complete: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
  },

  async isOnboardingComplete(): Promise<boolean> {
    const value = await this.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === "true";
  },

  // Primary Job Profile management
  async setPrimaryJobProfile(profile: object): Promise<void> {
    await this.setItem(
      STORAGE_KEYS.PRIMARY_JOB_PROFILE,
      JSON.stringify(profile)
    );
  },

  async getPrimaryJobProfile<T>(): Promise<T | null> {
    const profileStr = await this.getItem(STORAGE_KEYS.PRIMARY_JOB_PROFILE);
    if (!profileStr) return null;
    try {
      return JSON.parse(profileStr) as T;
    } catch {
      return null;
    }
  },

  async clearPrimaryJobProfile(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.PRIMARY_JOB_PROFILE);
  },

  // Theme
  async setTheme(theme: "light" | "dark" | "system"): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME, theme);
  },

  async getTheme(): Promise<"light" | "dark" | "system" | null> {
    const theme = await this.getItem(STORAGE_KEYS.THEME);
    return theme as "light" | "dark" | "system" | null;
  },

  // Clear all app data
  async clearAll(): Promise<void> {
    await Promise.all([
      this.clearTokens(),
      this.clearUser(),
      this.clearPrimaryJobProfile(),
      this.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
    ]);
  },
};

export { STORAGE_KEYS };
