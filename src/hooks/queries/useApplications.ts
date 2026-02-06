import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationService, GetApplicationsParams } from "../../services/application.service";
import { Application, ApplicationStats, PaginatedResponse } from "../../types";

export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params?: GetApplicationsParams) =>
    [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  stats: () => [...applicationKeys.all, "stats"] as const,
};

export function useApplications(params?: GetApplicationsParams) {
  return useQuery<PaginatedResponse<Application>>({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationService.getApplications(params),
  });
}

export function useApplication(id: string) {
  return useQuery<Application>({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationService.getApplication(id),
    enabled: !!id,
  });
}

export function useApplicationStats() {
  return useQuery<ApplicationStats>({
    queryKey: applicationKeys.stats(),
    queryFn: () => applicationService.getStats(),
  });
}

export function useRetryApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationService.retryApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationService.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}
