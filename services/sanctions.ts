import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PageResponse } from "@/lib/api/types";
import { queryKeys } from "@/services/query-keys";
import type { AdminUserSanction } from "@/types/admin-sanction";

export type AdminSanctionType = AdminUserSanction["type"];
export type AdminSanctionSeverity = Exclude<AdminUserSanction["severity"], null>;

/** Query parameters accepted by GET /admin/sanctions (ADM-084). */
export type AdminSanctionListQuery = Record<string, unknown> & {
  page: number;
  size: number;
  type?: readonly AdminSanctionType[];
  severity?: readonly AdminSanctionSeverity[];
  adminId?: string;
  from?: string;
  to?: string;
  activeOnly?: boolean;
};

/** Fetches the global newest-first enforcement history for ADM-097. */
export function useAdminSanctions(query: AdminSanctionListQuery) {
  return useQuery<PageResponse<AdminUserSanction>>({
    queryKey: queryKeys.sanctions.list(query),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserSanction>>(endpoints.sanctions.list, {
        query,
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}
