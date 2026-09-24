"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import { deleteUser, restoreUser } from "@/services/users";

import type { AdminUserDetail } from "./types";

export type UserLifecycleAction = "delete" | "restore";

export interface UserLifecycleInput {
  action: UserLifecycleAction;
  reason: string;
}

interface MutationContext {
  previous: AdminUserDetail | undefined;
}

/** Applies only the safe visible part of a soft-delete while the server request settles. */
export function optimisticUserAfterLifecycle(
  user: AdminUserDetail,
  input: UserLifecycleInput,
): AdminUserDetail {
  if (input.action !== "delete") return user;

  return {
    ...user,
    accountStatus: "DELETED",
    deletedAt: new Date().toISOString(),
  };
}

/** Safe, code-based copy for known lifecycle failures. Raw API messages never reach the UI. */
export function userLifecycleErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "USER_ANONYMISED":
      return "This account has been anonymised and cannot be restored.";
    case "VALIDATION_ERROR":
      return "Enter a reason with at least 10 characters.";
    case "FORBIDDEN":
      return "You are not authorized to perform this action.";
    case "NOT_FOUND":
      return "This user no longer exists. Refresh the record before trying again.";
    default:
      return null;
  }
}

/**
 * Runs a high-tier account lifecycle action with rollback and projection invalidation.
 *
 * <p>The high-tier dialog opens the server-side sudo window when the API returns
 * {@code ADMIN_SUDO_REQUIRED}; this hook deliberately knows nothing about credentials.
 */
export function useUserLifecycle(userId: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.users.detail(userId);

  const mutation = useMutation<void, unknown, UserLifecycleInput, MutationContext>({
    mutationFn: (input) => {
      switch (input.action) {
        case "delete":
          return deleteUser(userId, { reason: input.reason });
        case "restore":
          return restoreUser(userId, { reason: input.reason });
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<AdminUserDetail>(detailKey);

      if (previous) {
        queryClient.setQueryData(detailKey, optimisticUserAfterLifecycle(previous, input));
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

      if (input?.action === "delete") {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.users.sessionsAll(userId) }),
        );
      }

      return Promise.all(invalidations).then(() => undefined);
    },
  });

  return {
    execute: (input: UserLifecycleInput) => mutation.mutateAsync(input),
    pending: mutation.isPending,
    pendingAction: mutation.isPending ? (mutation.variables?.action ?? null) : null,
  };
}
