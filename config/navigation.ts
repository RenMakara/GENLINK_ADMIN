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
  UserCog,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/types/permissions";


export type NavPhase = "mvp" | 7 | 8 | 9 | 10 | "blocked";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to show this item, matching the API's permission codes. */
  permission: Permission;
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
      // One filterable list covers warnings and bans across users.
      { label: "Enforcement", href: "/enforcement", icon: ShieldAlert, permission: "user:warn", phase: "mvp" },
      { label: "Roles & Permissions", href: "/roles", icon: KeyRound, permission: "rbac:read", phase: "mvp" },
      { label: "Admin Users", href: "/admins", icon: UserCog, permission: "rbac:read", phase: "mvp" },
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
      // Badge catalogue changes require gamification permission, not per-user XP access.
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

/** Hides unavailable or unauthorized items and empty groups. Null skips permission filtering. */
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

/** Finds the longest navigation path prefix for the current route. */
export function activeItem(pathname: string): NavItem | undefined {
  return shippedItems()
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
