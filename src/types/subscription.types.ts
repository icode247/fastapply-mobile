// Subscription Types

export type SubscriptionTier =
  | "free"
  | "starter"
  | "pro"
  | "unlimited"
  | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "paused";

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  planType?: SubscriptionTier; // Added to match API response
  status: SubscriptionStatus;

  // Paddle info
  paddleSubscriptionId?: string;
  paddleCustomerId?: string;

  // Dates
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAt?: string;
  canceledAt?: string;
  trialEnd?: string;

  // Credits
  creditsRemaining?: number;
  creditsUsed?: number;
  creditsTotal?: number;

  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  creditsUsed: number;
  creditsRemaining: number;
  creditsTotal: number;
  applicationsThisMonth: number;
  applicationsToday: number;
  resetDate: string;
  subscription?: {
    limit: number;
    usage: number;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
  };
}

export interface CreditHistory {
  id: string;
  userId: string;
  amount: number;
  type: "used" | "added" | "refunded" | "expired";
  description?: string;
  applicationId?: string;
  createdAt: string;
}

export interface UpgradeSubscriptionDto {
  tier: SubscriptionTier;
  billingCycle?: "monthly" | "yearly";
}

export interface CancelSubscriptionDto {
  reason?: string;
  feedback?: string;
  cancelImmediately?: boolean;
}
