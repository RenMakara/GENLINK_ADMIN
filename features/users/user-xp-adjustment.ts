"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import { adjustUserXp } from "@/services/users";

import type { AdminUserDetail } from "./types";

export type UserXpAdjustmentAction = "grant-xp" | "revoke-xp";

export interface UserXpAdjustmentInput {
  action: UserXpAdjustmentAction;
  amount: number;
  reason: string;
}

interface MutationContext {
  previous: AdminUserDetail | undefined;
}

/** The backend's current level formula: level = 1 + floor(total XP / 100). */
export const XP_PER_LEVEL = 100;

export interface ProjectedXpState {
  totalXp: number;
  level: number;
}

export function projectXpState(totalXp: number, amount: number): ProjectedXpState {
  const projectedTotal = Math.max(0, totalXp + amount);
  return {
    totalXp: projectedTotal,
    level: 1 + Math.floor(projectedTotal / XP_PER_LEVEL),
  };
}

/** Applies the safe visible XP and level projection while the server request settles. */
export function optimisticUserAfterXpAdjustment(
  user: AdminUserDetail,
  input: UserXpAdjustmentInput,
): AdminUserDetail {
  const projected = projectXpState(user.totalXp, input.amount);
  return { ...user, totalXp: projected.totalXp, level: projected.level };
}

/** Safe, code-based copy for known XP adjustment failures. Raw API messages never reach the UI. */
export function userXpAdjustmentErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "FORBIDDEN":
      return "You are not authorized to adjust XP in this direction.";
    case "VALIDATION_ERROR":
      return "Enter a non-zero whole-number XP amount and a reason with at least 10 characters.";
    case "NOT_FOUND":
      return "This user no longer exists. Refresh the record before trying again.";
    case "USER_ANONYMISED":
      return "This anonymised account cannot be changed.";
    default:
      return null;
  }
}

/** Runs a signed XP adjustment with optimistic detail updates and XP projection refreshes. */
export function useUserXpAdjustment(userId: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.users.detail(userId);

  const mutation = useMutation<void, unknown, UserXpAdjustmentInput, MutationContext>({
    mutationFn: (input) =>
      adjustUserXp(userId, { amount: input.amount, reason: input.reason }).then(() => undefined),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<AdminUserDetail>(detailKey);

      if (previous) {
        queryClient.setQueryData(detailKey, optimisticUserAfterXpAdjustment(previous, input));
      }

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.xpAll(userId) }),
      ]).then(() => undefined),
  });

  return {
    execute: (input: UserXpAdjustmentInput) => mutation.mutateAsync(input),
    pending: mutation.isPending,
    pendingAction: mutation.isPending ? (mutation.variables?.action ?? null) : null,
  };
}
