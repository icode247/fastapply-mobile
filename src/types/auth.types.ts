// Authentication Types
import { JobProfile } from "./profile.types";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
  authProvider: "google" | "magic_link";
  userType: "normal" | "enterprise" | "admin";
  isActive: boolean;
  emailVerified: boolean;
  timezone?: string;
  howDidYouHearAboutUs?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  primaryJobProfile: JobProfile | null;
}

export interface RegisterDto {
  email: string;
  name: string;
  invitationToken?: string;
  referralCode?: string;
}

export interface SignInDto {
  email: string;
  invitationToken?: string;
}

export interface VerifyDto {
  token: string;
}

export interface MessageResponse {
  message: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}
