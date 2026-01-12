// Subscription Plan Limits
// Defines the limits for each subscription tier

export type PlanTier = "free" | "starter" | "pro" | "unlimited" | "enterprise";

export interface PlanLimits {
  maxProfiles: number;
  maxResumesPerProfile: number;
  maxApplicationsPerDay: number;
  hasAiTailoredResume: boolean;
  hasAiTailoredCoverLetter: boolean;
  hasPrioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxProfiles: 1,
    maxResumesPerProfile: 1,
    maxApplicationsPerDay: 0,
    hasAiTailoredResume: false,
    hasAiTailoredCoverLetter: false,
    hasPrioritySupport: false,
  },
  starter: {
    maxProfiles: 5,
    maxResumesPerProfile: 3,
    maxApplicationsPerDay: 100,
    hasAiTailoredResume: false,
    hasAiTailoredCoverLetter: false,
    hasPrioritySupport: false,
  },
  pro: {
    maxProfiles: 10,
    maxResumesPerProfile: 5,
    maxApplicationsPerDay: 170,
    hasAiTailoredResume: true,
    hasAiTailoredCoverLetter: true,
    hasPrioritySupport: false,
  },
  unlimited: {
    maxProfiles: 20,
    maxResumesPerProfile: -1, // -1 = unlimited
    maxApplicationsPerDay: -1, // -1 = unlimited
    hasAiTailoredResume: true,
    hasAiTailoredCoverLetter: true,
    hasPrioritySupport: true,
  },
  enterprise: {
    maxProfiles: -1, // unlimited
    maxResumesPerProfile: -1,
    maxApplicationsPerDay: -1,
    hasAiTailoredResume: true,
    hasAiTailoredCoverLetter: true,
    hasPrioritySupport: true,
  },
};

/**
 * Get limits for a specific plan tier
 */
export const getPlanLimits = (tier: string): PlanLimits => {
  return PLAN_LIMITS[tier as PlanTier] || PLAN_LIMITS.free;
};

/**
 * Check if a limit is unlimited (-1)
 */
export const isUnlimited = (limit: number): boolean => limit === -1;

/**
 * Check if user is within profile limit
 */
export const canCreateProfile = (
  tier: string,
  currentProfileCount: number
): { allowed: boolean; limit: number; current: number } => {
  const limits = getPlanLimits(tier);
  const allowed =
    isUnlimited(limits.maxProfiles) || currentProfileCount < limits.maxProfiles;
  return {
    allowed,
    limit: limits.maxProfiles,
    current: currentProfileCount,
  };
};

/**
 * Check if user is within resume upload limit for a profile
 */
export const canUploadResume = (
  tier: string,
  currentResumeCount: number
): { allowed: boolean; limit: number; current: number } => {
  const limits = getPlanLimits(tier);
  const allowed =
    isUnlimited(limits.maxResumesPerProfile) ||
    currentResumeCount < limits.maxResumesPerProfile;
  return {
    allowed,
    limit: limits.maxResumesPerProfile,
    current: currentResumeCount,
  };
};

/**
 * Get display name for plan tier
 */
export const getPlanDisplayName = (tier: string): string => {
  const names: Record<string, string> = {
    free: "Free",
    starter: "Starter Pack",
    pro: "Pro Pack",
    unlimited: "Early Bird Ultimate",
    enterprise: "Enterprise",
  };
  return names[tier] || "Free";
};
