import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api, request as apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { TableFilterCodec, TableState } from "@/hooks/use-table-state";
import type { PageResponse } from "@/lib/api/types";
import { queryKeys } from "@/services/query-keys";

import { USER_FILTER_CODECS, type UserFilters } from "@/features/users/user-filters";
import type {
  AdminUserActivity,
  AdminUserDetail,
  AdminUserLoginHistory,
  AdminUserNote,
  AdminUserSession,
  AdminUserTableRow,
  AdminUserWarningResult,
  AdminUserXp,
} from "@/features/users/types";
import type { AdminUserSanction } from "@/types/admin-sanction";

export type UserListTableState = Pick<
  TableState<UserFilters>,
  "search" | "filters" | "sorting" | "pageIndex" | "pageSize"
>;

export type UserListQuery = Record<string, unknown>;

/**
 * Converts the URL-owned table state to the documented ADM-059 query contract.
 *
 * The hook owns URL encoding; the API client owns HTTP encoding. Keeping this adapter pure makes
 * it possible to verify that the two contracts agree without rendering a page or making a call.
 */
export function buildUserListQuery(state: UserListTableState): UserListQuery {
  const query: UserListQuery = {
    page: state.pageIndex,
    size: state.pageSize,
  };

  const search = state.search.trim();
  if (search) query.q = search;

  if (state.sorting.length > 0) {
    query.sort = state.sorting.map((sort) => `${sort.id},${sort.desc ? "desc" : "asc"}`);
  }

  const codecs = USER_FILTER_CODECS as Record<keyof UserFilters, TableFilterCodec<unknown>>;
  for (const key of Object.keys(USER_FILTER_CODECS) as Array<keyof UserFilters>) {
    const values = codecs[key].serialize(state.filters[key] as unknown);
    if (values.length === 1) query[key] = values[0];
    else if (values.length > 1) query[key] = values;
  }

  return query;
}

/**
 * Converts the same URL-owned table state to the ADM-087 export contract.
 * Pagination is deliberately omitted: the backend exports the complete filtered result, while
 * sorting and every active filter remain identical to the visible Users table.
 */
export function buildUserExportQuery(state: UserListTableState): UserListQuery {
  const query = buildUserListQuery(state);
  delete query.page;
  delete query.size;
  return query;
}

/** Requests the audited CSV stream for the current filtered Users view (ADM-099). */
export function exportUsersCsv(query: UserListQuery, reason: string) {
  return api.download(endpoints.users.export, {
    accept: "text/csv",
    query: { ...query, reason },
  });
}

/** ADM-076/110's bounded user search query using the backend's supported minimum page size. */
export function buildUserSearchQuery(search: string): UserListQuery {
  return { q: search.trim(), page: 0, size: 25 };
}

/** Fetches the read-only Users list described by ADM-059 and consumed by ADM-072. */
export function useUserList(query: UserListQuery) {
  return useQuery<PageResponse<AdminUserTableRow>>({
    queryKey: queryKeys.users.list(query),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserTableRow>>(endpoints.users.list, { query, signal }),
    placeholderData: keepPreviousData,
  });
}

/** Fetches the five safe user summaries used by the debounced ADM-076 command-palette search. */
export function useUserSearch(search: string, enabled = true) {
  const query = search.trim();

  return useQuery<PageResponse<AdminUserTableRow>>({
    queryKey: queryKeys.users.search(query),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserTableRow>>(endpoints.users.list, {
        query: buildUserSearchQuery(query),
        signal,
      }),
    enabled: enabled && query.length > 0,
  });
}

/** Fetches one read-only user projection for the ADM-073 detail header and later tabs. */
export function useUserDetail(userId: string) {
  return useQuery<AdminUserDetail>({
    queryKey: queryKeys.users.detail(userId),
    queryFn: ({ signal }) =>
      api.get<AdminUserDetail>(endpoints.users.detail(userId), { signal }),
    enabled: Boolean(userId),
  });
}

export interface UserReasonRequest {
  reason: string;
}

export interface UserSuspendRequest extends UserReasonRequest {
  durationHours: number;
}

/** ADM-078 contract calls used by ADM-091; server authorization remains authoritative. */
export function banUser(userId: string, request: UserReasonRequest) {
  return api.post<void>(endpoints.users.ban(userId), request);
}

/** ADM-078 contract calls used by ADM-091; server authorization remains authoritative. */
export function unbanUser(userId: string, request: UserReasonRequest) {
  return api.post<void>(endpoints.users.unban(userId), request);
}

/** ADM-078 contract calls used by ADM-091; server authorization remains authoritative. */
export function suspendUser(userId: string, request: UserSuspendRequest) {
  return api.post<void>(endpoints.users.suspend(userId), request);
}

/** ADM-080 contract call used by the ADM-092 recovery dialogs. */
export function verifyUserEmail(userId: string) {
  return api.post<void>(endpoints.users.verifyEmail(userId));
}

/** ADM-080 contract call used by the ADM-092 recovery dialogs. */
export function resetUserPassword(userId: string) {
  return api.post<void>(endpoints.users.resetPassword(userId));
}

/** ADM-080 contract call used by the ADM-092 recovery dialogs. */
export function forceLogoutUser(userId: string) {
  return api.post<void>(endpoints.users.forceLogout(userId));
}

export type UserLifecycleRequest = UserReasonRequest;

/** ADM-081 contract call used by the ADM-093 lifecycle dialogs. */
export function deleteUser(userId: string, request: UserLifecycleRequest) {
  return apiRequest<void>(endpoints.users.delete(userId), {
    method: "DELETE",
    body: request,
  });
}

/** ADM-081 contract call used by the ADM-093 lifecycle dialogs. */
export function restoreUser(userId: string, request: UserLifecycleRequest) {
  return api.post<void>(endpoints.users.restore(userId), request);
}

export interface UserXpAdjustmentRequest extends UserReasonRequest {
  amount: number;
}

export interface UserXpAdjustmentResponse {
  userId: string;
  requestedAmount: number;
  appliedAmount: number;
  totalXp: number;
  level: number;
}

/** ADM-082 contract call used by the ADM-094 XP adjustment dialog. */
export function adjustUserXp(userId: string, request: UserXpAdjustmentRequest) {
  return api.post<UserXpAdjustmentResponse>(endpoints.users.xpAdjustment(userId), request);
}

export type UserSanctionType = AdminUserSanction["type"];

export type UserSanctionListQuery = Record<string, unknown> & {
  page: number;
  size: number;
  type?: UserSanctionType;
};

/** Fetches one newest-first page of the per-user ADM-084 enforcement timeline. */
export function useUserSanctions(userId: string, query: UserSanctionListQuery) {
  return useQuery<PageResponse<AdminUserSanction>>({
    queryKey: queryKeys.users.sanctions(userId, query),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserSanction>>(endpoints.users.sanctions(userId), {
        query,
        signal,
      }),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

/** ADM-084 lift contract used by the ADM-095 timeline action. */
export function liftUserSanction(sanctionId: string, request: UserReasonRequest) {
  return api.post<void>(endpoints.sanctions.lift(sanctionId), request);
}

export type UserWarningSeverity = AdminUserWarningResult["severity"];

export interface UserWarningRequest extends UserReasonRequest {
  severity: UserWarningSeverity;
  messageEn: string;
  messageKm: string;
}

/** ADM-083 warning contract used by the ADM-096 warning dialog. */
export function createUserWarning(userId: string, request: UserWarningRequest) {
  return api.post<AdminUserWarningResult>(endpoints.users.warnings(userId), request);
}

/** Fetches the append-only staff-only Notes tab projection. */
export function useUserNotes(userId: string, page: number, size: number) {
  return useQuery<PageResponse<AdminUserNote>>({
    queryKey: queryKeys.users.notes(userId, page, size),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserNote>>(endpoints.users.notes(userId), {
        query: { page, size },
        signal,
      }),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export interface UserNoteRequest {
  note: string;
}

/** ADM-083 staff-only append operation used by the ADM-096 note dialog. */
export function createUserNote(userId: string, request: UserNoteRequest) {
  return api.post<AdminUserNote>(endpoints.users.notes(userId), request);
}

/** Fetches ADM-065 activity counters only when the Activity tab is mounted. */
export function useUserActivity(userId: string) {
  return useQuery<AdminUserActivity>({
    queryKey: queryKeys.users.activity(userId),
    queryFn: ({ signal }) =>
      api.get<AdminUserActivity>(endpoints.users.activity(userId), { signal }),
    enabled: Boolean(userId),
  });
}

/** Fetches one page of active sessions for ADM-075's Sessions tab. */
export function useUserSessions(userId: string, page: number, size: number) {
  return useQuery<PageResponse<AdminUserSession>>({
    queryKey: queryKeys.users.sessions(userId, page, size),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserSession>>(endpoints.users.sessions(userId), {
        query: { page, size },
        signal,
      }),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

/** Fetches one page of login history for ADM-075's Login history tab. */
export function useUserLoginHistory(userId: string, page: number, size: number) {
  return useQuery<PageResponse<AdminUserLoginHistory>>({
    queryKey: queryKeys.users.loginHistory(userId, page, size),
    queryFn: ({ signal }) =>
      api.get<PageResponse<AdminUserLoginHistory>>(endpoints.users.loginHistory(userId), {
        query: { page, size },
        signal,
      }),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

/** Fetches XP summary, source breakdown, badges and one ledger page for ADM-075. */
export function useUserXp(userId: string, page: number, size: number) {
  return useQuery<AdminUserXp>({
    queryKey: queryKeys.users.xp(userId, page, size),
    queryFn: ({ signal }) =>
      api.get<AdminUserXp>(endpoints.users.xp(userId), {
        query: { page, size },
        signal,
      }),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
