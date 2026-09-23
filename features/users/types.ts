import type { UserStatus } from "@/lib/ui/status";
import type { PageResponse } from "@/lib/api/types";

/**
 * Work-status codes persisted by the user module. Keeping the labels in the table feature
 * avoids leaking backend enum formatting into every cell that displays one.
 */
export const USER_WORK_STATUSES = [
  "STUDENT",
  "FRESH_GRADUATE",
  "YOUNG_PROFESSIONAL",
  "CREATOR",
  "FREELANCER",
  "ENTREPRENEUR",
  "OTHER",
] as const;

export type UserWorkStatus = (typeof USER_WORK_STATUSES)[number];

/**
 * The frontend row contract for ADM-069.
 *
 * The eventual ADM-059 API adapter should map its `userId` and admin-role fields to this shape.
 * The table deliberately does not expose a backend entity or accept a password/account-secret
 * field. Optional display values are rendered as an explicit em dash instead of an empty cell.
 */
export interface AdminUserTableRow {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  accountStatus: UserStatus;
  /** Human-readable staff role; ordinary users have no admin role. */
  adminRoleName?: string | null;
  universityName?: string | null;
  workStatus?: UserWorkStatus | null;
  level: number;
  totalXp: number;
  /** ISO-8601 UTC timestamp from the API. */
  createdAt: string;
  /** ISO-8601 UTC timestamp from the API; null means no successful activity is known. */
  lastActiveAt?: string | null;
}

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
