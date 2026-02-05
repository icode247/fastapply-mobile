import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import { API_BASE_URL } from "../constants/api";
import { storage } from "../utils/storage";

// Extended config type to track retry attempts
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Session expiration handler - will be set by auth store
let onSessionExpired: (() => void) | null = null;

/**
 * Set the callback to be called when the session expires
 * This should be called by the auth store on initialization
 */
export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler;
};

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple token refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // If no config or already retried, reject
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If 401 and not a refresh request
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        await storage.setTokens(accessToken, newRefreshToken);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Notify subscribers
        onTokenRefreshed(accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        await storage.clearAll();

        // Notify the auth store that the session has expired
        if (onSessionExpired) {
          onSessionExpired();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// File data type for uploads - supports both web File objects and native URIs
export interface FileData {
  uri: string;
  name: string;
  type: string;
  file?: File; // Web only - actual File object from document picker
}

// Helper for multipart form data (file uploads)
// Using fetch instead of axios for better React Native FormData compatibility
export const uploadFile = async (
  url: string,
  fileData: FileData,
  onProgress?: (progress: number) => void,
  fieldName: string = "file"
) => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // On web, we need to use the actual File object if available
    if (fileData.file) {
      // Web with actual File object from expo-document-picker
      formData.append(fieldName, fileData.file, fileData.name);
    } else {
      // Web fallback - create a Blob from the URI (for data URIs)
      try {
        const response = await fetch(fileData.uri);
        const blob = await response.blob();
        formData.append(fieldName, blob, fileData.name);
      } catch {
        // Last resort - just pass what we have
        formData.append(fieldName, fileData.uri);
      }
    }
  } else {
    // For React Native (iOS/Android)
    // Handle file:// prefix - some backends don't accept it
    let uri = fileData.uri;
    if (Platform.OS === "ios" && uri.startsWith("file://")) {
      // Keep file:// for React Native FormData - it needs it
      // The FormData polyfill will handle the actual file reading
    }

    // Create file object in the format React Native expects
    formData.append(fieldName, {
      uri: uri,
      name: fileData.name,
      type: fileData.type || "application/octet-stream",
    } as any);
  }

  const token = await storage.getAccessToken();

  // Use fetch instead of axios for FormData - more reliable in React Native
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      // Don't set Content-Type - fetch will set it with boundary automatically
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return { data };
};

// Error type guard
export const isApiError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

// Check if error is a 404 Not Found
export const isNotFoundError = (error: unknown): boolean => {
  return isApiError(error) && error.response?.status === 404;
};

// Get error message from API error
export const getApiErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export default api;
