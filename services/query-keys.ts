/**
 * Every TanStack Query key in the application.
 *
 * <p>Keys live here rather than inline so that invalidation after a mutation is reliable
 * instead of guesswork (SSOT §12.1). Banning a user has to refresh the user list, that user's
 * detail, and their enforcement timeline — with inline arrays, finding all three means
 * grepping for string literals and hoping, and a missed one shows the moderator stale data
 * immediately after they acted.
 *
 * <p>An ESLint rule rejects array literals passed as `queryKey`, so this is enforced rather
 * than merely encouraged.
 *
 * <h2>Shape</h2>
 *
 * Keys are hierarchical, broadest first, so a partial key invalidates everything beneath it:
 *
 * <pre>
 *   queryKeys.users.all()          ['users']                      — every user query
 *   queryKeys.users.lists()        ['users', 'list']              — every list, any filter
 *   queryKeys.users.list(params)   ['users', 'list', {...}]       — one filtered list
 *   queryKeys.users.detail(id)     ['users', 'detail', 'u1']      — one user
 * </pre>
 *
 * `invalidateQueries({ queryKey: queryKeys.users.all() })` then covers all of them, because
 * TanStack matches by prefix.
 *
 * <h2>Growth</h2>
 *
 * Only areas that have endpoints today appear here. Each feature task adds its own namespace;
 * a speculative key for an unbuilt endpoint is indistinguishable from a working one at the
 * call site.
 */

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
} as const;

/**
 * Parameters that identify a list query.
 *
 * <p>Included in the key so two different filters are two different cache entries rather than
 * one entry that flickers between them.
 */
export type ListKeyParams = Record<string, unknown> | undefined;
