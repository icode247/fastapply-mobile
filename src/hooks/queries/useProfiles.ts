import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "../../services/profile.service";
import { CreateJobProfileDto, JobProfile, UpdateJobProfileDto } from "../../types";

export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  list: () => [...profileKeys.lists()] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  primary: () => [...profileKeys.all, "primary"] as const,
};

export function useProfiles() {
  return useQuery<JobProfile[]>({
    queryKey: profileKeys.list(),
    queryFn: () => profileService.getProfiles(),
  });
}

export function useProfile(id: string) {
  return useQuery<JobProfile>({
    queryKey: profileKeys.detail(id),
    queryFn: () => profileService.getProfile(id),
    enabled: !!id,
  });
}

export function usePrimaryProfile() {
  return useQuery<JobProfile | null>({
    queryKey: profileKeys.primary(),
    queryFn: () => profileService.getPrimaryProfile(),
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobProfileDto) =>
      profileService.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobProfileDto }) =>
      profileService.updateProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profileService.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useSetPrimaryProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profileService.setPrimaryProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
