import { Platform } from "react-native";

import Constants from "expo-constants";

// Helper to pick the right URL
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Use the IP address of the computer running the Expo server
  // This is required for physical devices to connect to the backend
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (localhost) {
    return `http://${localhost}:3001`;
  }

  // Automatic selection for development (fallbacks)
  if (Platform.OS === "android") {
    return "https://proindustry-bicyclic-alfredia.ngrok-free.dev"; // Android Emulator
  }

  // iOS Simulator and Web
  return "https://proindustry-bicyclic-alfredia.ngrok-free.dev";
};

export const API_BASE_URL = getBaseUrl();

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: "/api/v1/auth/register",
    SIGNIN: "/api/v1/auth/signin",
    VERIFY: "/api/v1/auth/verify",
    VERIFY_OTP: "/api/v1/auth/verify-otp",
    GOOGLE: "/api/v1/auth/google",
    GOOGLE_CALLBACK: "/api/v1/auth/google/callback",
    REFRESH: "/api/v1/auth/refresh",
    LOGOUT: "/api/v1/auth/logout",
    ME: "/api/v1/auth/me",
  },
  // Users
  USERS: {
    ME: "/api/v1/users/me",
    STATS: "/api/v1/users/me/stats",
    UPDATE: "/api/v1/users/me",
    DELETE: "/api/v1/users/me",
  },
  // Job Profiles
  PROFILES: {
    BASE: "/api/v1/job-profiles",
    PRIMARY: "/api/v1/job-profiles/primary",
    BY_ID: (id: string) => `/api/v1/job-profiles/${id}`,
    SET_DEFAULT: (id: string) => `/api/v1/job-profiles/${id}/set-default`,
    RESUMES: (id: string) => `/api/v1/job-profiles/${id}/resumes`,
    DELETE_RESUME: (resumeId: string) =>
      `/api/v1/job-profiles/resumes/${resumeId}`,
    SET_PRIMARY_RESUME: (resumeId: string) =>
      `/api/v1/job-profiles/resumes/${resumeId}/set-primary`,
    DOWNLOAD_RESUME: (resumeId: string) =>
      `/api/v1/job-profiles/resumes/${resumeId}/download`,
  },
  // Applications
  APPLICATIONS: {
    BASE: "/api/v1/applications",
    STATS: "/api/v1/applications/stats",
    BY_ID: (id: string) => `/api/v1/applications/${id}`,
    RETRY: (id: string) => `/api/v1/applications/${id}/retry`,
    CAN_APPLY: "/api/v1/applications/can-apply",
  },
  // Resume Parser
  RESUME: {
    PARSE: "/api/v1/resumes/parse",
    EXTRACT_TEXT: "/api/v1/resumes/extract-text",
  },
  // Subscriptions
  SUBSCRIPTIONS: {
    CURRENT: "/api/v1/subscriptions/current",
    USAGE: "/api/v1/subscriptions/usage",
    UPGRADE: "/api/v1/subscriptions/upgrade",
    CANCEL: "/api/v1/subscriptions/cancel",
  },
  // Automations
  AUTOMATIONS: {
    BASE: "/api/v1/automations",
    BY_ID: (id: string) => `/api/v1/automations/${id}`,
    TOGGLE: (id: string) => `/api/v1/automations/${id}/toggle`,
    URLS: (id: string) => `/api/v1/automations/${id}/urls`,
    URLS_RETRY: (id: string) => `/api/v1/automations/${id}/urls/retry`,
    QUEUE_STATS: (id: string) => `/api/v1/automations/${id}/queue-stats`,
    RUNS: (id: string) => `/api/v1/automations/${id}/runs`,
    STATS: (id: string) => `/api/v1/automations/${id}/stats`,
  },
} as const;

// App Configuration
export const APP_CONFIG = {
  APP_NAME: "FastApply",
  APP_SCHEME: "fastapply",
  TOKEN_REFRESH_THRESHOLD: 60 * 5, // 5 minutes before expiry
  MAX_RESUME_SIZE_MB: 5,
  SUPPORTED_RESUME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;
