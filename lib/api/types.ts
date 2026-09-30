
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  /** UTC. Rendered through the Asia/Phnom_Penh formatter (SSOT §9.5). */
  timestamp: string;
}

/**
 * Field for field with the backend record. It exists because Spring's own `Page` serialises
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
 * The fixed shape every bulk endpoint returns .
 *
 * Bulk operations are **partial-success, not transactional**, and always return `200` —
 * never `207` or `400`. An all-or-nothing bulk ban that rolls back because one target was
 * already deleted is worse than useless to a moderator, so the result reports what happened
 * per row and the UI renders "47 of 50 succeeded" with the failures listed.
 *
 * Typed once here because one component renders all of them.
 */
export interface BulkResult {
  /** Client-supplied; the server deduplicates replays of the same batch for 24 hours. */
  batchId: string;
  requested: number;
  succeeded: number;
  failed: BulkFailure[];
}

/** Safe metadata returned by the Admin badge catalogue projection. */
export interface AdminBadgeOption {
  badgeId: string;
  nameEn: string;
  nameKm?: string | null;
  descriptionEn?: string | null;
  descriptionKm?: string | null;
  requirement?: string | null;
  iconUrl?: string | null;
}

/** Existing Admin-managed notification template projection used by the bulk notifier. */
export interface AdminNotificationTemplate {
  id: string;
  templateKey: string;
  titleEn: string;
  titleKm?: string | null;
  messageEn: string;
  messageKm?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Query parameters accepted by every paginated endpoint. */
export interface PageParams {
  page?: number;
  size?: number;
  /** Spring's format, e.g. `createdAt,desc`. Properties are whitelisted server-side. */
  sort?: string;
}
