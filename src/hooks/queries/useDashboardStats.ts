import { useQuery } from "@tanstack/react-query";
import { applicationService } from "../../services/application.service";
import { subscriptionService } from "../../services/subscription.service";
import { UserStats, userService } from "../../services/user.service";
import { ApplicationStats, Subscription, UsageStats } from "../../types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  userStats: () => [...dashboardKeys.all, "userStats"] as const,
  appStats: () => [...dashboardKeys.all, "appStats"] as const,
  subscription: () => [...dashboardKeys.all, "subscription"] as const,
  usage: () => [...dashboardKeys.all, "usage"] as const,
};

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: dashboardKeys.userStats(),
    queryFn: () => userService.getMyStats(),
  });
}

export function useAppStats() {
  return useQuery<ApplicationStats>({
    queryKey: dashboardKeys.appStats(),
    queryFn: () => applicationService.getStats(),
  });
}

export function useSubscription() {
  return useQuery<Subscription>({
    queryKey: dashboardKeys.subscription(),
    queryFn: () => subscriptionService.getCurrentSubscription(),
  });
}

export function useUsageStats() {
  return useQuery<UsageStats>({
    queryKey: dashboardKeys.usage(),
    queryFn: () => subscriptionService.getUsageStats(),
  });
}
