import { useCallback } from "react";
import { authService } from "../services";
import { getApiErrorMessage } from "../services/api";
import { useAuthStore } from "../stores";
import { AuthResponse, RegisterDto, SignInDto, VerifyOtpDto } from "../types";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasCompletedOnboarding,
    initialize,
    login,
    logout,
    setHasCompletedOnboarding,
    refreshUser,
  } = useAuthStore();

  const register = useCallback(async (data: RegisterDto) => {
    try {
      const response = await authService.register(data);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: getApiErrorMessage(error) };
    }
  }, []);

  const signIn = useCallback(async (data: SignInDto) => {
    try {
      const response = await authService.signIn(data);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: getApiErrorMessage(error) };
    }
  }, []);

  const verifyMagicLink = useCallback(
    async (token: string) => {
      try {
        const response: AuthResponse = await authService.verify(token);
        await login(response.tokens, response.user, response.primaryJobProfile);
        return { success: true, user: response.user };
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error) };
      }
    },
    [login]
  );

  const verifyOtp = useCallback(
    async (data: VerifyOtpDto) => {
      try {
        const response = await authService.verifyOtp(data);
        await login(response.tokens, response.user, response.primaryJobProfile);
        return { success: true, user: response.user };
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error) };
      }
    },
    [login]
  );

  const handleGoogleCallback = useCallback(
    async (code: string) => {
      try {
        const response = await authService.handleGoogleCallback(code);
        await login(response.tokens, response.user, response.primaryJobProfile);
        return { success: true, user: response.user };
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error) };
      }
    },
    [login]
  );

  const signOut = useCallback(async () => {
    await logout();
  }, [logout]);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
  }, [setHasCompletedOnboarding]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasCompletedOnboarding,

    // Actions
    initialize,
    register,
    signIn,
    verifyMagicLink,
    verifyOtp,
    handleGoogleCallback,
    signOut,
    logout: signOut,
    refreshUser,
    completeOnboarding,
  };
};

export default useAuth;
