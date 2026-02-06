import { ENDPOINTS } from "../constants/api";
import {
  AuthResponse,
  AuthTokens,
  MessageResponse,
  RegisterDto,
  SignInDto,
  User,
  VerifyOtpDto,
} from "../types";
import { logger } from "../utils/logger";
import { storage } from "../utils/storage";
import { api, getApiErrorMessage } from "./api";

export const authService = {
  /**
   * Register a new user account
   */
  async register(data: RegisterDto): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  },

  /**
   * Sign in with email (sends magic link)
   */
  async signIn(data: SignInDto): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>(
      ENDPOINTS.AUTH.SIGNIN,
      data
    );
    return response.data;
  },

  /**
   * Verify OTP and get auth tokens
   */
  async verifyOtp(data: VerifyOtpDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      ENDPOINTS.AUTH.VERIFY_OTP,
      data
    );
    const { tokens, user, primaryJobProfile } = response.data;

    // Store tokens, user, and primary job profile
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    await storage.setUser(user);
    if (primaryJobProfile) {
      await storage.setPrimaryJobProfile(primaryJobProfile);
    }

    return response.data;
  },

  /**
   * Verify magic link token and get auth tokens
   */
  async verify(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY, {
      token,
    });
    const { tokens, user, primaryJobProfile } = response.data;

    // Store tokens, user, and primary job profile
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    await storage.setUser(user);
    if (primaryJobProfile) {
      await storage.setPrimaryJobProfile(primaryJobProfile);
    }

    return response.data;
  },

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>(
      `${ENDPOINTS.AUTH.GOOGLE_CALLBACK}?code=${code}`
    );
    const { tokens, user, primaryJobProfile } = response.data;

    // Store tokens, user, and primary job profile
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    await storage.setUser(user);
    if (primaryJobProfile) {
      await storage.setPrimaryJobProfile(primaryJobProfile);
    }

    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post<AuthTokens>(
      ENDPOINTS.AUTH.REFRESH,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const tokens = response.data;
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);

    return tokens;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(ENDPOINTS.AUTH.ME);
    await storage.setUser(response.data);
    return response.data;
  },

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      logger.warn("Logout API call failed:", getApiErrorMessage(error));
    } finally {
      await storage.clearAll();
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAccessToken();
    return !!token;
  },

  /**
   * Get stored user
   */
  async getStoredUser(): Promise<User | null> {
    return storage.getUser<User>();
  },

  /**
   * Get Google OAuth URL for sign in
   */
  getGoogleAuthUrl(): string {
    return `${ENDPOINTS.AUTH.GOOGLE}`;
  },
};

export default authService;
