"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import {
  forceLogoutUser,
  resetUserPassword,
  verifyUserEmail,
} from "@/services/users";

import type { AdminUserDetail } from "./types";

export type UserRecoveryAction = "verify-email" | "reset-password" | "force-logout";

export interface UserRecoveryInput {
  action: UserRecoveryAction;
  /** Required by the medium force-logout confirmation; low-tier actions pass an empty string. */
  reason: string;
}

interface MutationContext {
  previous: AdminUserDetail | undefined;
}

/** Applies the safe visible result of email verification while the server request settles. */
export function optimisticUserAfterRecovery(
  user: AdminUserDetail,
  input: UserRecoveryInput,
): AdminUserDetail {
  if (input.action !== "verify-email") return user;

  return {
    ...user,
    emailVerified: true,
    accountStatus: user.accountStatus === "PENDING" ? "ACTIVE" : user.accountStatus,
  };
}

/** Safe, code-based copy for known recovery failures. Raw API messages never reach the UI. */
export function userRecoveryErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "USER_ANONYMISED":
      return "This anonymised account cannot be changed.";
    case "FORBIDDEN":
      return "You are not authorized to perform this action.";
    case "NOT_FOUND":
      return "This user no longer exists. Refresh the record before trying again.";
    default:
      return null;
  }
}

/** Runs account recovery and refreshes affected user projections. */
export function useUserRecovery(userId: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.users.detail(userId);

  const mutation = useMutation<void, unknown, UserRecoveryInput, MutationContext>({
    mutationFn: (input) => {
      switch (input.action) {
        case "verify-email":
          return verifyUserEmail(userId);
        case "reset-password":
          return resetUserPassword(userId);
        case "force-logout":
          return forceLogoutUser(userId);
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<AdminUserDetail>(detailKey);

      if (previous) {
        queryClient.setQueryData(detailKey, optimisticUserAfterRecovery(previous, input));
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

      if (input?.action === "force-logout") {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.users.sessionsAll(userId) }),
        );
      }

      return Promise.all(invalidations).then(() => undefined);
    },
  });

  return {
    execute: (input: UserRecoveryInput) => mutation.mutateAsync(input),
    pending: mutation.isPending,
    pendingAction: mutation.isPending ? (mutation.variables?.action ?? null) : null,
  };
}
