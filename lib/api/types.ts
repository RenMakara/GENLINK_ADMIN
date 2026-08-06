/**
 * TypeScript mirrors of the backend's response records.
 *
 * <p>These are hand-written rather than generated, and they must track
 * `shared/response/ApiResponse.java` and `shared/response/PageResponse.java` exactly. The
 * admin surface is small enough that a codegen step would cost more than it saves — revisit
 * if it passes roughly 60 endpoints (SSOT §3).
 */

/**
 * The envelope every endpoint returns (`API_STANDARDS.md`).
 *
 * <p>`message` is for humans reading logs. **The UI never parses it** — it maps `errorCode`,
 * which is the published contract (SSOT §8 C-2). A message is free to be reworded; a code is
 * not.
 *
 * <p>`data` and `errorCode` are optional because the backend serialises with
 * `@JsonInclude(NON_NULL)`: a success omits `errorCode`, a failure omits `data`.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  /** ISO-8601 UTC. Rendered through the Asia/Phnom_Penh formatter (SSOT §9.5). */
  timestamp: string;
}

/**
 * Pagination envelope, carried *inside* {@link ApiResponse} so the response shape stays
 * uniform.
 *
 * <p>Field for field with the backend record. It exists because Spring's own `Page` serialises
 * its internal `Pageable`, which is unstable across versions and leaks sort/offset internals
 * the client has no use for.
 */
export interface PageResponse<T> {
  content: T[];
  /** Zero-based. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/** One failure inside a bulk result. */
export interface BulkFailure {
  id: string;
  errorCode: string;
}

/**
 * The fixed shape every bulk endpoint returns (SSOT §8 C-3).
 *
 * <p>Bulk operations are **partial-success, not transactional**, and always return `200` —
 * never `207` or `400`. An all-or-nothing bulk ban that rolls back because one target was
 * already deleted is worse than useless to a moderator, so the result reports what happened
 * per row and the UI renders "47 of 50 succeeded" with the failures listed.
 *
 * <p>Typed once here because one component renders all of them.
 */
export interface BulkResult {
  /** Client-supplied; the server deduplicates replays of the same batch for 24 hours. */
  batchId: string;
  requested: number;
  succeeded: number;
  failed: BulkFailure[];
}

/** Query parameters accepted by every paginated endpoint. */
export interface PageParams {
  page?: number;
  size?: number;
  /** Spring's format, e.g. `createdAt,desc`. Properties are whitelisted server-side. */
  sort?: string;
}
