import { ENDPOINTS } from "../constants/api";
import {
  CancelSubscriptionDto,
  CreditHistory,
  PaginatedResponse,
  Subscription,
  UpgradeSubscriptionDto,
  UsageStats,
} from "../types";
import { api } from "./api";

export const subscriptionService = {
  /**
   * Get current user's subscription
   */
  async getCurrentSubscription(): Promise<Subscription> {
    const response = await api.get<any>(ENDPOINTS.SUBSCRIPTIONS.CURRENT);

    const data = response.data;

    // Map planType to tier if tier is missing
    if (data && !data.tier && data.planType) {
      data.tier = data.planType;
    }

    return data as Subscription;
  },

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    const response = await api.get<UsageStats>(ENDPOINTS.SUBSCRIPTIONS.USAGE);
    return response.data;
  },

  /**
   * Get credit history
   */
  async getCreditHistory(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<CreditHistory>> {
    const response = await api.get<PaginatedResponse<CreditHistory>>(
      `${ENDPOINTS.SUBSCRIPTIONS.CURRENT}/credit-history?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(
    data: UpgradeSubscriptionDto
  ): Promise<Subscription> {
    const response = await api.post<Subscription>(
      ENDPOINTS.SUBSCRIPTIONS.UPGRADE,
      data
    );
    return response.data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(data: CancelSubscriptionDto): Promise<Subscription> {
    const response = await api.post<Subscription>(
      ENDPOINTS.SUBSCRIPTIONS.CANCEL,
      data
    );
    return response.data;
  },

  /**
   * Check if user has credits available
   */
  async hasCreditsAvailable(): Promise<boolean> {
    const usage = await this.getUsageStats();
    return usage.creditsRemaining > 0;
  },

  /**
   * Get subscription tier features
   */
  getTierFeatures(tier: string): string[] {
    const features: Record<string, string[]> = {
      free: [
        "5 job applications per month",
        "Basic job profile",
        "Manual applications only",
      ],
      starter: [
        "50 job applications per month",
        "AI-powered resume matching",
        "1 job profile",
        "Email support",
      ],
      pro: [
        "200 job applications per month",
        "AI-powered resume tailoring",
        "3 job profiles",
        "Priority support",
        "Application analytics",
      ],
      unlimited: [
        "Unlimited job applications",
        "All AI features",
        "Unlimited job profiles",
        "Priority support",
        "Advanced analytics",
        "API access",
      ],
      enterprise: [
        "Everything in Unlimited",
        "Team management",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
      ],
    };

    return features[tier] || features.free;
  },
};

export default subscriptionService;
