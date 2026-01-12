import { User } from "../types";
import { api } from "./api";

export interface UpdateUserProfileDto {
  name?: string;
  timezone?: string;
  avatarUrl?: string;
  howDidYouHearAboutUs?: string;
}

export interface UserStats {
  totalApplications: number;
  applicationsThisMonth: number;
  profilesCount: number;
  successRate: number;
}

export const userService = {
  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>("/api/v1/users/me");
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateMe(data: UpdateUserProfileDto): Promise<User> {
    const response = await api.patch<User>("/api/v1/users/me", data);
    return response.data;
  },

  /**
   * Get user statistics
   */
  async getMyStats(): Promise<UserStats> {
    const response = await api.get<UserStats>("/api/v1/users/me/stats");
    return response.data;
  },

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<void> {
    await api.delete("/api/v1/users/me");
  },

  /**
   * Update user push notification token
   */
  async updatePushToken(token: string): Promise<void> {
    await api.patch("/api/v1/users/me", { pushToken: token });
  },
};

export default userService;
