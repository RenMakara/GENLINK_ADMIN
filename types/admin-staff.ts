/** Safe staff-directory projection returned by GET /api/v1/admin/admins. */
export interface AdminStaff {
  adminId: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  roleId: string | null;
  roleCode: string | null;
  roleName: string | null;
  active: boolean;
  totpEnabled: boolean;
  totpConfirmed: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}
