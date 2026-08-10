/**
 * Typed builders for the backend's pinned response shapes (SSOT §8).
 *
 * <p>These are the *only* place a mock body is constructed, so every fixture and handler shares
 * one definition of the envelope, the page wrapper and the bulk result. They reuse the
 * interfaces from `lib/api/types` rather than re-declaring them — a fixture that drifts from the
 * client's own types would defeat the purpose of mocking against a pinned contract.
 *
 * <p>Pure and isomorphic: no `msw` import, no DOM, no network. `handlers.ts` wraps these in
 * `HttpResponse`; a unit test can call them directly.
 */

import type { ApiResponse, BulkFailure, BulkResult, PageResponse } from "@/lib/api/types";

/** A fixed instant, so a fixture is deterministic unless a test overrides it. */
const DEFAULT_TIMESTAMP = "2026-08-10T12:00:00.000Z";

/**
 * A success envelope (SSOT §8, `API_STANDARDS.md`).
 *
 * <p>`errorCode` is omitted, exactly as the backend's `@JsonInclude(NON_NULL)` omits it on
 * success — a fixture that carried an empty one would not match the wire shape.
 */
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

/**
 * A failure envelope (SSOT §8 C-2).
 *
 * <p>`data` is absent, again mirroring `NON_NULL`. `errorCode` is the published contract the UI
 * branches on; `message` is diagnostic only and defaults to the code so a fixture never has to
 * invent human copy.
 */
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

/**
 * A page wrapper (`PageResponse<T>`), with `totalPages` and `hasNext` **derived** rather than
 * passed in — the two fields the frontend actually paginates on, so a hand-set inconsistent
 * value is exactly the bug a fixture must not teach the UI to tolerate.
 */
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

/**
 * A bulk result (SSOT §8 C-3): partial-success, always the same shape.
 *
 * <p>`succeeded` defaults to `requested - failed.length`, the invariant every bulk endpoint
 * holds, so a caller supplies the failures and gets a consistent count for free.
 */
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
