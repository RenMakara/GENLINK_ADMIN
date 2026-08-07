import {
  BarChart3,
  Bell,
  CalendarDays,
  Flag,
  Gauge,
  Image,
  KeyRound,
  Languages,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The sidebar, from SSOT §3.
 *
 * <h2>Every item is listed, including ones that must not render yet</h2>
 *
 * The alternative — writing down only the six MVP entries — would make "only MVP items appear"
 * true by omission, and there would be nothing to test. Declaring the whole map and filtering on
 * {@link NavItem.phase} makes it a behaviour: `visibleGroups()` can be checked against a menu
 * that genuinely contains Phase 7–10 entries, and shipping one later is a one-word edit rather
 * than an archaeology exercise in the SSOT.
 */

/** The phase an item becomes reachable. `mvp` = present at the end of Phase 6. */
export type NavPhase = "mvp" | 7 | 8 | 9 | 10 | "blocked";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Permission code required to see this item, without the `PERM_` prefix — the shape
   * `/admin/auth/me` returns.
   *
   * <p>Filtering is not applied yet: the auth provider is ADM-035 and `usePermission` is
   * ADM-038, both of which land after this shell. The codes are declared now so wiring them up
   * is a change in one place, and so the sidebar cannot quietly ship without them.
   */
  permission: string;
  phase: NavPhase;
}

export interface NavGroup {
  /** Section header. Not an accordion — an admin should never open a drawer to find a page. */
  label: string;
  items: NavItem[];
}

export const NAVIGATION: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view", phase: "mvp" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Users", href: "/users", icon: Users, permission: "user:read", phase: "mvp" },
      // "Enforcement", not "Warnings & Bans": one filterable list across all users, matching the
      // merged user_sanctions model (SSOT §9.2, §14 review).
      { label: "Enforcement", href: "/enforcement", icon: ShieldAlert, permission: "user:warn", phase: "mvp" },
      { label: "Roles & Permissions", href: "/roles", icon: KeyRound, permission: "rbac:read", phase: "mvp" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Community", href: "/moderation/community", icon: MessageSquare, permission: "community:moderate", phase: 7 },
      { label: "Forum", href: "/moderation/forum", icon: MessageSquare, permission: "forum:moderate", phase: 7 },
      { label: "Events", href: "/events", icon: CalendarDays, permission: "event:read", phase: 8 },
      { label: "Opportunities", href: "/opportunities", icon: Sparkles, permission: "opportunity:manage", phase: 8 },
      { label: "Media Library", href: "/media", icon: Image, permission: "media:read", phase: 8 },
      { label: "Stories", href: "/stories", icon: Image, permission: "story:moderate", phase: "blocked" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, permission: "notification:send", phase: 8 },
      // gamification:manage, NOT xp:grant. This page rewrites the badge catalogue; reusing the
      // per-user XP permission would hand that power to anyone who can adjust one user's score.
      { label: "Gamification", href: "/gamification", icon: Trophy, permission: "gamification:manage", phase: 8 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Reports & Abuse", href: "/reports", icon: Flag, permission: "report:read", phase: 7 },
      { label: "Finance", href: "/finance", icon: Gauge, permission: "finance:read", phase: 9 },
      { label: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics:view", phase: "mvp" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Audit Logs", href: "/audit-logs", icon: ScrollText, permission: "audit:read", phase: "mvp" },
      { label: "Localization", href: "/localization", icon: Languages, permission: "localization:manage", phase: 9 },
      { label: "Settings", href: "/settings", icon: Settings, permission: "settings:manage", phase: 10 },
    ],
  },
] as const;

/**
 * The groups to render.
 *
 * <p>Two rules from SSOT §3, both of which hide rather than disable:
 *
 * <ul>
 *   <li>An item whose phase has not shipped does not appear <em>at all</em>. A nav entry leading
 *       to an empty page is worse than a shorter menu.</li>
 *   <li>A group left with no visible children hides its header too — otherwise the sidebar grows
 *       section titles with nothing under them.</li>
 * </ul>
 *
 * @param permissions codes the current admin holds. **Pass `null` to skip permission filtering**,
 *     which is what the shell does until ADM-035 supplies a real set — an empty array would
 *     correctly render an empty sidebar and make the shell impossible to look at.
 */
export function visibleGroups(permissions: readonly string[] | null): NavGroup[] {
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.phase === "mvp" && (permissions === null || permissions.includes(item.permission)),
    ),
  })).filter((group) => group.items.length > 0);
}

/** Flat list of shipped routes, for tests and for the breadcrumb label lookup. */
export function shippedItems(): NavItem[] {
  return NAVIGATION.flatMap((group) => group.items).filter((item) => item.phase === "mvp");
}

/**
 * The nav item whose section the given path belongs to.
 *
 * <p>Matched by prefix so a detail page (`/users/123`) keeps its parent highlighted. Longest
 * match wins, so `/moderation/forum` does not light up under `/moderation`.
 */
export function activeItem(pathname: string): NavItem | undefined {
  return shippedItems()
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
