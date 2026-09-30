/** Typed MSW fixtures matching the API response shapes. */

import type { ApiResponse, BulkFailure, BulkResult, PageResponse } from "@/lib/api/types";

/** A fixed instant, so a fixture is deterministic unless a test overrides it. */
const DEFAULT_TIMESTAMP = "2026-08-10T12:00:00.000Z";

/** Builds an API success envelope. */
export function apiResponse<T>(
  data: T,
  overrides: Partial<Pick<ApiResponse<T>, "message" | "timestamp">> = {},
): ApiResponse<T> {
  return {
    success: true,
    message: overrides.message ?? "OK",
    data,
    timestamp: overrides.timestamp ?? DEFAULT_TIMESTAMP,
  };
}

/** Builds an API failure envelope. */
export function apiError(
  errorCode: string,
  overrides: { message?: string; timestamp?: string } = {},
): ApiResponse<never> {
  return {
    success: false,
    message: overrides.message ?? errorCode,
    errorCode,
    timestamp: overrides.timestamp ?? DEFAULT_TIMESTAMP,
  };
}

/** Builds a page response with derived pagination fields. */
export function pageResponse<T>(
  content: T[],
  overrides: { page?: number; size?: number; totalElements?: number } = {},
): PageResponse<T> {
  const page = overrides.page ?? 0;
  const size = overrides.size ?? 25;
  const totalElements = overrides.totalElements ?? content.length;
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    // Zero-based page index, so the last page is `totalPages - 1`.
    hasNext: page < totalPages - 1,
  };
}

/** Builds a partial-success bulk response. */
export function bulkResult(
  overrides: {
    batchId?: string;
    requested?: number;
    succeeded?: number;
    failed?: BulkFailure[];
  } = {},
): BulkResult {
  const failed = overrides.failed ?? [];
  const requested = overrides.requested ?? failed.length;

  return {
    batchId: overrides.batchId ?? "00000000-0000-0000-0000-000000000000",
    requested,
    succeeded: overrides.succeeded ?? requested - failed.length,
    failed,
  };
}
