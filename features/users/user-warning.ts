"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import { createUserWarning, type UserWarningRequest } from "@/services/users";

/** Safe, code-based copy for known warning failures. */
export function userWarningErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "FORBIDDEN":
      return "You are not authorized to issue warnings.";
    case "NOT_FOUND":
      return "This user no longer exists. Refresh the record before trying again.";
    case "USER_ANONYMISED":
      return "This anonymised account cannot be changed.";
    case "VALIDATION_ERROR":
      return "Check the severity, reason, and both bilingual message fields before trying again.";
    default:
      return null;
  }
}

/** Records a warning and refreshes the user's enforcement timeline. */
export function useUserWarning(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, unknown, UserWarningRequest>({
    mutationFn: (request) => createUserWarning(userId, request),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.sanctionsAll(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
      ]).then(() => undefined),
  });

  return {
    execute: (request: UserWarningRequest) => mutation.mutateAsync(request).then(() => undefined),
    pending: mutation.isPending,
  };
}
