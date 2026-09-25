/** Safe role summary returned by GET /api/v1/admin/roles. */
export interface AdminRoleSummary {
  roleId: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  adminCount: number;
}

/** One permission in the enum-backed catalogue returned by the backend. */
export interface AdminPermission {
  code: string;
  resource: string;
  action: string;
  description: string;
}

/** Permissions grouped by their resource prefix for the matrix editor. */
export interface AdminPermissionGroup {
  resource: string;
  permissions: AdminPermission[];
}

/** Full role projection consumed by the ADM-108 permission matrix. */
export interface AdminRoleDetail extends AdminRoleSummary {
  permissions: string[];
}
