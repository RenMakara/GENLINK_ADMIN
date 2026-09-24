import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";
import type {
  AdminBadgeOption,
  AdminNotificationTemplate,
  BulkFailure,
  BulkResult,
} from "@/lib/api/types";
import { queryKeys } from "@/services/query-keys";

/** The server-side cap from ADM-086. The client chunks before making a request. */
export const BULK_ACTION_LIMIT = 500;

export type BulkActionName = "ban" | "notify" | "badge";

export interface BulkBanInput {
  action: "ban";
  userIds: readonly string[];
  reason: string;
}

export interface BulkNotifyInput {
  action: "notify";
  userIds: readonly string[];
  templateKey: string;
  parameters: Record<string, string>;
  reason: string;
}

export interface BulkBadgeInput {
  action: "badge";
  userIds: readonly string[];
  badgeId: string;
  reason: string;
}

export type BulkActionInput = BulkBanInput | BulkNotifyInput | BulkBadgeInput;

/** One logical UI action may contain several server batches. */
export interface AggregatedBulkResult extends BulkResult {
  batchIds: string[];
}

export interface BulkActionExecutionOptions {
  /** Test seam; production uses the browser's UUID implementation. */
  createBatchId?: () => string;
}

/** Removes duplicate ids while keeping the order in which the operator selected them. */
export function uniqueUserIds(userIds: readonly string[]): string[] {
  return [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
}

/** Splits a selection into server-sized requests without changing its order. */
export function chunkUserIds(
  userIds: readonly string[],
  chunkSize = BULK_ACTION_LIMIT,
): string[][] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError("chunkSize must be a positive integer");
  }

  const uniqueIds = uniqueUserIds(userIds);
  const chunks: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    chunks.push(uniqueIds.slice(index, index + chunkSize));
  }
  return chunks;
}

export function createBulkBatchId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("Secure UUID generation is unavailable");
  }
  return globalThis.crypto.randomUUID();
}

function isRequestConfigurationError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  // Permission, authentication, sudo, and validation failures describe the operation itself;
  // turning them into 500 per-user failures would hide the action the operator must take.
  return error.status === 401 || error.status === 403 || error.status === 400;
}

function safeTransportFailureCode(error: unknown): string {
  if (error instanceof ApiError && error.rawCode) return error.rawCode;
  return "INTERNAL_SERVER_ERROR";
}

async function sendChunk(input: BulkActionInput, userIds: string[], batchId: string) {
  switch (input.action) {
    case "ban":
      return api.post<BulkResult>(endpoints.users.bulk.ban, {
        batchId,
        userIds,
        reason: input.reason,
      });
    case "notify":
      return api.post<BulkResult>(endpoints.users.bulk.notify, {
        batchId,
        userIds,
        templateKey: input.templateKey,
        parameters: input.parameters,
        reason: input.reason,
      });
    case "badge":
      return api.post<BulkResult>(endpoints.users.bulk.badges, {
        batchId,
        userIds,
        badgeId: input.badgeId,
        reason: input.reason,
      });
  }
}

/**
 * Runs a bounded, partial-success operation. Requests are sequential so a 500-user selection
 * does not create a burst of concurrent writes, and every chunk receives a new batch id because
 * the backend deduplicates each id for 24 hours.
 */
export async function executeBulkAction(
  input: BulkActionInput,
  options: BulkActionExecutionOptions = {},
): Promise<AggregatedBulkResult> {
  const ids = uniqueUserIds(input.userIds);
  if (ids.length === 0) throw new Error("At least one user must be selected");

  const createBatchId = options.createBatchId ?? createBulkBatchId;
  const batchIds: string[] = [];
  const failed: BulkFailure[] = [];
  let succeeded = 0;

  for (const chunk of chunkUserIds(ids)) {
    const batchId = createBatchId();
    batchIds.push(batchId);

    try {
      const result = await sendChunk(input, chunk, batchId);
      succeeded += result.succeeded;
      failed.push(...result.failed);
    } catch (error) {
      if (isRequestConfigurationError(error)) throw error;
      // A failed transport/5xx chunk has no trustworthy per-user server response. It is still
      // represented per user so the result never claims that those users succeeded.
      const errorCode = safeTransportFailureCode(error);
      failed.push(...chunk.map((id) => ({ id, errorCode })));
    }
  }

  return {
    batchId: batchIds[0],
    batchIds,
    requested: ids.length,
    succeeded,
    failed,
  };
}

/** Fetches the permission-gated Admin badge picker catalogue. */
export function useAdminBadges(enabled = true) {
  return useQuery<AdminBadgeOption[]>({
    queryKey: queryKeys.badges.list(),
    queryFn: ({ signal }) => api.get<AdminBadgeOption[]>(endpoints.badges.list, { signal }),
    enabled,
  });
}

/** Suggests existing ADMIN_ templates when the operator also manages templates. */
export function useAdminNotificationTemplates(enabled = true) {
  return useQuery<AdminNotificationTemplate[]>({
    queryKey: queryKeys.notifications.templates(),
    queryFn: ({ signal }) =>
      api.get<AdminNotificationTemplate[]>(endpoints.notifications.templates, { signal }),
    enabled,
  });
}

/** Mutates one logical selection and refreshes the affected Admin projections. */
export function useBulkActions() {
  const queryClient = useQueryClient();
  const mutation = useMutation<AggregatedBulkResult, unknown, BulkActionInput>({
    mutationFn: (input) => executeBulkAction(input),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all() }),
      ]).then(() => undefined),
  });

  return {
    execute: (input: BulkActionInput) => mutation.mutateAsync(input),
    pending: mutation.isPending,
  };
}
