import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  AdminPermissionGroup,
  AdminRoleDetail,
  AdminRoleSummary,
} from "@/types/admin-role";

import { queryKeys } from "./query-keys";

/** Fetches the role catalogue and active admin counts for ADM-107. */
export function useAdminRoles(enabled = true) {
  return useQuery<AdminRoleSummary[]>({
    queryKey: queryKeys.roles.list(),
    queryFn: ({ signal }) => api.get<AdminRoleSummary[]>(endpoints.roles.list, { signal }),
    enabled,
  });
}

/** Fetches one role and its effective permission codes for ADM-108. */
export function useAdminRole(roleId: string, enabled = true) {
  return useQuery<AdminRoleDetail>({
    queryKey: queryKeys.roles.detail(roleId),
    queryFn: ({ signal }) => api.get<AdminRoleDetail>(endpoints.roles.detail(roleId), { signal }),
    enabled: enabled && Boolean(roleId),
  });
}

/** Fetches the enum-backed permission catalogue grouped by resource for ADM-108. */
export function useAdminPermissionGroups(enabled = true) {
  return useQuery<AdminPermissionGroup[]>({
    queryKey: queryKeys.roles.permissions(),
    queryFn: ({ signal }) =>
      api.get<AdminPermissionGroup[]>(endpoints.roles.permissions, { signal }),
    enabled,
  });
}

export interface ReplaceAdminRolePermissionsInput {
  roleId: string;
  permissions: string[];
  reason: string;
}

/** Replaces a role's complete permission set through the audited ADM-102 endpoint. */
export function useReplaceAdminRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation<AdminRoleDetail, unknown, ReplaceAdminRolePermissionsInput>({
    mutationFn: ({ roleId, permissions, reason }) =>
      api.put<AdminRoleDetail>(endpoints.roles.updatePermissions(roleId), {
        permissions,
        reason,
      }),
    onSuccess: (role) => {
      queryClient.setQueryData(queryKeys.roles.detail(role.roleId), role);
      return queryClient.invalidateQueries({ queryKey: queryKeys.roles.list() }).then(() => undefined);
    },
  });
}
