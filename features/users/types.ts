import type { UserStatus } from "@/lib/ui/status";
import type { PageResponse } from "@/lib/api/types";
import type { UserWorkStatus } from "@/types/admin-user";

export type { AdminUserSanction } from "@/types/admin-sanction";
export { USER_WORK_STATUSES } from "@/types/admin-user";
export type { AdminUserTableRow, UserWorkStatus } from "@/types/admin-user";

/**
 * The ADM-062 detail projection consumed by the ADM-073 header. It intentionally mirrors the
 * public response shape rather than a backend entity, and contains no credential material.
 */
export interface AdminUserDetailInterest {
  interestId: string;
  code: string;
  name: string;
  category: string;
}

export interface AdminUserDetailSocialLink {
  platform: string;
  url: string;
}

export interface AdminUserCurrentSanction {
  type: string;
  severity: string;
  reason: string | null;
  previousStatus: UserStatus;
  startsAt: string;
  expiresAt: string | null;
  acknowledgedAt: string | null;
}

/** ADM-083 staff-only note projection used by the user-detail Notes tab. */
export interface AdminUserNote {
  noteId: string;
  userId: string;
  adminUserId: string;
  note: string;
  createdAt: string;
}

/** ADM-083 warning response projection, including the explicit delivery gap. */
export interface AdminUserWarningResult {
  warningId: string;
  userId: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  messageEn: string;
  messageKm: string;
  delivered: boolean;
  deliveryStatus: string;
  recordedAt: string;
}

export interface AdminUserDetail {
  userId: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phoneNumber: string | null;
  location: string | null;
  universityName: string | null;
  workStatus: UserWorkStatus | null;
  preferredLanguage: string | null;
  coverPreset: number;
  interests: AdminUserDetailInterest[];
  socialLinks: AdminUserDetailSocialLink[];
  portfolioCount: number;
  email: string;
  emailVerified: boolean;
  authProvider: string | null;
  googleLinked: boolean;
  accountStatus: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tokenVersion: number;
  mobileRole: string | null;
  totalXp: number;
  level: number;
  adminRoleName: string | null;
  currentSanction: AdminUserCurrentSanction | null;
}

/** ADM-065 read-only cross-domain activity counters for the Activity tab. */
export interface AdminUserActivity {
  userId: string;
  posts: number;
  comments: number;
  communitiesJoined: number;
  eventsRsvpd: number;
  reportsFiled: number;
  reportsReceived: number;
}

/** ADM-063 safe projection of one active refresh-token session. */
export interface AdminUserSession {
  sessionId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

/** ADM-064 safe projection of one user-scoped login/security event. */
export interface AdminUserLoginHistory {
  auditId: string;
  eventType: string | null;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string | null;
}

/** ADM-063/064 read-only XP projection returned by the user detail endpoint. */
export interface AdminUserXp {
  userId: string;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  levelProgressPercent: number;
  breakdown: AdminUserXpBreakdown[];
  ledger: PageResponse<AdminUserXpLedgerEntry>;
  badges: AdminUserEarnedBadge[];
}

export interface AdminUserXpBreakdown {
  sourceType: string | null;
  xpAmount: number;
  entryCount: number;
}

export interface AdminUserXpLedgerEntry {
  xpHistoryId: string;
  sourceType: string | null;
  sourceId: string | null;
  xpAmount: number;
  timestamp: string | null;
}

export interface AdminUserEarnedBadge {
  badgeId: string;
  code: string | null;
  nameEn: string | null;
  nameKm: string | null;
  descriptionEn: string | null;
  descriptionKm: string | null;
  requirement: string | null;
  iconUrl: string | null;
  unlockedAt: string | null;
}
