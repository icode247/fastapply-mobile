import { ENDPOINTS } from "../constants/api";
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
    const response = await api.get<User>(ENDPOINTS.USERS.ME);
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateMe(data: UpdateUserProfileDto): Promise<User> {
    const response = await api.patch<User>(ENDPOINTS.USERS.UPDATE, data);
    return response.data;
  },

  /**
   * Get user statistics
   */
  async getMyStats(): Promise<UserStats> {
    const response = await api.get<UserStats>(ENDPOINTS.USERS.STATS);
    return response.data;
  },

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<void> {
    await api.delete(ENDPOINTS.USERS.DELETE);
  },

  /**
   * Update user push notification token
   */
  async updatePushToken(token: string): Promise<void> {
    await api.patch(ENDPOINTS.USERS.UPDATE, { pushToken: token });
  },
};

export default userService;
