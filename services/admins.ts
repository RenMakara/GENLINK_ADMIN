import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PageResponse } from "@/lib/api/types";
import type { AdminStaff } from "@/types/admin-staff";

import { queryKeys } from "./query-keys";

export type AdminListQuery = Record<string, unknown> & {
  page: number;
  size: number;
};

/** Fetches the staff directory; server authorization remains authoritative. */
export function useAdminStaff(query: AdminListQuery, enabled = true) {
  return useQuery<PageResponse<AdminStaff>>({
    queryKey: queryKeys.admins.list(query),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminStaff>>(endpoints.admins.list, { query, signal }),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export interface ChangeAdminRoleInput {
  adminId: string;
  roleId: string;
  reason: string;
}

export interface AdminReasonInput {
  adminId: string;
  reason: string;
}

function invalidateAdminDirectory(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.admins.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.roles.list() }),
  ]).then(() => undefined);
}

/** Reassigns one staff profile through the audited ADM-103 endpoint. */
export function useChangeAdminRole() {
  const queryClient = useQueryClient();

  return useMutation<AdminStaff, unknown, ChangeAdminRoleInput>({
    mutationFn: ({ adminId, roleId, reason }) =>
      api.put<AdminStaff>(endpoints.admins.changeRole(adminId), { roleId, reason }),
    onSuccess: () => invalidateAdminDirectory(queryClient),
  });
}

/** Revokes staff access while preserving the linked user account. */
export function useDeactivateAdmin() {
  const queryClient = useQueryClient();

  return useMutation<AdminStaff, unknown, AdminReasonInput>({
    mutationFn: ({ adminId, reason }) =>
      api.post<AdminStaff>(endpoints.admins.deactivate(adminId), { reason }),
    onSuccess: () => invalidateAdminDirectory(queryClient),
  });
}

/** Clears another admin's MFA state and forces fresh enrolment at next sign-in. */
export function useResetAdminMfa() {
  const queryClient = useQueryClient();

  return useMutation<AdminStaff, unknown, AdminReasonInput>({
    mutationFn: ({ adminId, reason }) =>
      api.post<AdminStaff>(endpoints.admins.resetMfa(adminId), { reason }),
    onSuccess: () => invalidateAdminDirectory(queryClient),
  });
}
