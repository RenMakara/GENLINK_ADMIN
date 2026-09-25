import type { UserStatus } from "@/lib/ui/status";

/** Work-status codes shared by user search, user tables, and admin promotion flows. */
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

/** Safe user-list projection used when selecting an existing account for admin promotion. */
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
