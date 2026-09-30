"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import { banUser, suspendUser, unbanUser } from "@/services/users";

import type { AdminUserDetail } from "./types";

/** Fixed sanction durations used by enforcement controls. */
export const SUSPENSION_DURATION_OPTIONS = [
  { value: 24, label: "24 hours" },
  { value: 24 * 7, label: "7 days" },
  { value: 24 * 30, label: "30 days" },
] as const;

export type UserEnforcementAction = "ban" | "unban" | "suspend";
export type SuspensionDurationHours = (typeof SUSPENSION_DURATION_OPTIONS)[number]["value"];

export interface UserEnforcementInput {
  action: UserEnforcementAction;
  reason: string;
  durationHours?: number;
}

interface MutationContext {
  previous: AdminUserDetail | undefined;
}

/** Applies a safe optimistic update and refreshes server-owned sanction details. */
export function optimisticUserAfterEnforcement(
  user: AdminUserDetail,
  input: UserEnforcementInput,
): AdminUserDetail {
  if (input.action === "ban") {
    return { ...user, accountStatus: "BANNED" };
  }

  if (input.action === "suspend") {
    return { ...user, accountStatus: "SUSPENDED" };
  }

  return {
    ...user,
    accountStatus: user.currentSanction?.previousStatus ?? "ACTIVE",
    currentSanction: null,
  };
}

/** Safe, code-based copy for known enforcement failures. Raw API messages never reach the UI. */
export function userEnforcementErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "USER_ALREADY_BANNED":
      return "This user is already banned. Refresh the record before trying again.";
    case "USER_NOT_BANNED":
      return "This user is not currently banned. Refresh the record before trying again.";
    case "USER_ANONYMISED":
      return "This anonymised account cannot be changed.";
    case "VALIDATION_ERROR":
      return "Enter a reason with at least 10 characters.";
    case "FORBIDDEN":
      return "You are not authorized to perform this action.";
    default:
      return null;
  }
}

/** Runs enforcement with rollback and projection refresh on completion. */
export function useUserEnforcement(userId: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.users.detail(userId);

  const mutation = useMutation<void, unknown, UserEnforcementInput, MutationContext>({
    mutationFn: (input) => {
      switch (input.action) {
        case "ban":
          return banUser(userId, { reason: input.reason });
        case "unban":
          return unbanUser(userId, { reason: input.reason });
        case "suspend":
          if (!Number.isFinite(input.durationHours) || (input.durationHours ?? 0) <= 0) {
            return Promise.reject(new Error("A suspension duration is required."));
          }
          return suspendUser(userId, {
            reason: input.reason,
            durationHours: input.durationHours as number,
          });
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<AdminUserDetail>(detailKey);

      if (previous) {
        queryClient.setQueryData(detailKey, optimisticUserAfterEnforcement(previous, input));
      }

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: (_data, _error, input) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: detailKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
      ];

      if (input?.action === "ban") {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.users.sessionsAll(userId) }),
        );
      }

      return Promise.all(invalidations).then(() => undefined);
    },
  });

  return {
    execute: (input: UserEnforcementInput) => mutation.mutateAsync(input),
    pending: mutation.isPending,
    pendingAction: mutation.isPending ? (mutation.variables?.action ?? null) : null,
  };
}
