"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import { liftUserSanction } from "@/services/users";

export interface UserSanctionLiftInput {
  sanctionId: string;
  reason: string;
}

/** Safe, code-based copy for known sanction-lift failures. */
export function userSanctionLiftErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "FORBIDDEN":
      return "You are not authorized to lift enforcement records.";
    case "NOT_FOUND":
      return "This enforcement record no longer exists. Refresh the timeline before trying again.";
    case "USER_ANONYMISED":
      return "This anonymised account cannot be changed.";
    case "USER_NOT_BANNED":
      return "The account state changed before this record could be lifted. Refresh the timeline.";
    case "VALIDATION_ERROR":
      return "This enforcement record is already lifted or unavailable, or the reason is invalid.";
    default:
      return null;
  }
}

/** Lifts one sanction and refreshes the user detail, global, and enforcement projections. */
export function useSanctionLift(userId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, unknown, UserSanctionLiftInput>({
    mutationFn: ({ sanctionId, reason }) => liftUserSanction(sanctionId, { reason }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all() }),
        ...(userId
          ? [
              queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) }),
              queryClient.invalidateQueries({ queryKey: queryKeys.users.sanctionsAll(userId) }),
              queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
            ]
          : []),
      ]).then(() => undefined),
  });

  return {
    execute: (input: UserSanctionLiftInput) => mutation.mutateAsync(input),
    pending: mutation.isPending,
    pendingSanctionId: mutation.isPending ? (mutation.variables?.sanctionId ?? null) : null,
  };
}
