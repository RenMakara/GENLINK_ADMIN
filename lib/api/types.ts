/** TypeScript mirrors of the backend response records. */

/** API response envelope; optional fields match the backend's null-omission rules. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  /** ISO-8601 UTC. Rendered through the Asia/Phnom_Penh formatter (SSOT §9.5). */
  timestamp: string;
}

/** Stable pagination fields nested inside the API response envelope. */
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

/** Per-item result shape for partial-success bulk operations. */
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
