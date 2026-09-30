/** Central query keys keep cache invalidation consistent. */

import {
  analyticsQueryKey,
  type AnalyticsDashboardId,
  type AnalyticsQuery,
} from "@/features/analytics/analytics-state";

export const queryKeys = {
  auth: {
    all: () => ["auth"] as const,
    /** The signed-in admin: identity, role and resolved permissions (ADM-024). */
    me: () => ["auth", "me"] as const,
  },
  dashboard: {
    all: () => ["dashboard"] as const,
    /** Aggregate BFF-lite summary endpoint (ADM-045, ADM-051, ADM-052). */
    summary: () => ["dashboard", "summary"] as const,
  },
  analytics: {
    all: () => ["admin", "analytics"] as const,
    /** One URL-scoped analytics series (ADM-117/118). */
    series: (dashboard: AnalyticsDashboardId, query: AnalyticsQuery | null) =>
      query
        ? analyticsQueryKey(dashboard, query)
        : (["admin", "analytics", dashboard, "disabled"] as const),
  },
  auditLogs: {
    all: () => ["audit-logs"] as const,
    list: (params: ListKeyParams) => ["audit-logs", "list", params] as const,
    detail: (auditLogId: string) => ["audit-logs", "detail", auditLogId] as const,
  },
  roles: {
    all: () => ["roles"] as const,
    /** Role metadata and active admin counts (ADM-101/107). */
    list: () => ["roles", "list"] as const,
    /** One role's metadata and effective permission codes (ADM-101/108). */
    detail: (roleId: string) => ["roles", "detail", roleId] as const,
    /** Enum-backed permission catalogue grouped by resource (ADM-101/108). */
    permissions: () => ["roles", "permissions"] as const,
  },
  admins: {
    all: () => ["admins"] as const,
    /** Paginated staff directory entries (ADM-103/109). */
    list: (params: ListKeyParams) => ["admins", "list", params] as const,
  },
  users: {
    all: () => ["users"] as const,
    lists: () => ["users", "list"] as const,
    list: (params: ListKeyParams) => ["users", "list", params] as const,
    search: (query: string) => ["users", "search", query] as const,
    detail: (userId: string) => ["users", "detail", userId] as const,
    activity: (userId: string) => ["users", "activity", userId] as const,
    sessions: (userId: string, page: number, size: number) =>
      ["users", "sessions", userId, { page, size }] as const,
    sessionsAll: (userId: string) => ["users", "sessions", userId] as const,
    loginHistory: (userId: string, page: number, size: number) =>
      ["users", "login-history", userId, { page, size }] as const,
    xp: (userId: string, page: number, size: number) =>
      ["users", "xp", userId, { page, size }] as const,
    xpAll: (userId: string) => ["users", "xp", userId] as const,
    sanctions: (userId: string, params: ListKeyParams) =>
      ["users", "sanctions", userId, params] as const,
    sanctionsAll: (userId: string) => ["users", "sanctions", userId] as const,
    notes: (userId: string, page: number, size: number) =>
      ["users", "notes", userId, { page, size }] as const,
    notesAll: (userId: string) => ["users", "notes", userId] as const,
  },
  sanctions: {
    all: () => ["sanctions"] as const,
    list: (params: ListKeyParams) => ["sanctions", "list", params] as const,
  },
  system: {
    all: () => ["system"] as const,
    /** System health summary endpoint (ADM-047, ADM-055). */
    health: () => ["system", "health"] as const,
  },
  badges: {
    all: () => ["badges"] as const,
    list: () => ["badges", "list"] as const,
  },
  notifications: {
    all: () => ["notifications"] as const,
    templates: () => ["notifications", "templates"] as const,
  },
} as const;

/** List filters form part of the cache key. */
export type ListKeyParams = Record<string, unknown> | undefined;
