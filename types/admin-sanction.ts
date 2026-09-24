import type { UserStatus } from "@/lib/ui/status";

/** Safe staff projection shared by the per-user and global enforcement surfaces. */
export interface AdminUserSanction {
  sanctionId: string;
  userId: string | null;
  userFullName: string | null;
  type: "WARNING" | "SUSPENSION" | "BAN";
  severity: "LOW" | "MEDIUM" | "HIGH" | null;
  reason: string | null;
  messageEn: string | null;
  messageKm: string | null;
  previousStatus: UserStatus | null;
  startsAt: string;
  expiresAt: string | null;
  acknowledgedAt: string | null;
  liftedAt: string | null;
  liftReason: string | null;
  issuedByAdminId: string | null;
  issuedByAdminName: string | null;
  liftedByAdminId: string | null;
  liftedByAdminName: string | null;
  active: boolean;
}
