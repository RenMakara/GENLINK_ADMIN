"use client";

import Link from "next/link";
import { Activity, UserPlus } from "lucide-react";

import { EmptyState, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, formatRelative } from "@/lib/utils/date";
import type { UserStatus } from "@/lib/ui/status";

export interface AdminActionLog {
  id: string;
  actorEmail: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface UserRegistrationLog {
  id: string;
  fullName: string;
  email: string;
  universityName?: string;
  status: UserStatus;
  joinedAt: string;
}

export interface RecentActivityData {
  adminActions?: AdminActionLog[] | null;
  registrations?: UserRegistrationLog[] | null;
}

export interface RecentActivityPanelsProps {
  /** Summary data payload containing recent activity lists */
  data?: RecentActivityData | null;
  /** True while payload is loading */
  loading?: boolean;
  /** Container CSS class name */
  className?: string;
}

/** Get initials for avatar circle fallback (e.g. "Sok Dara" -> "SD"). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** 1. Recent Admin Actions Panel (SSOT §2.3) */
export function RecentAdminActionsPanel({
  actions,
  loading = false,
}: {
  actions?: AdminActionLog[] | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
              <div className="flex flex-col gap-1 w-2/3">
                <div className="bg-muted h-3.5 w-full rounded" />
                <div className="bg-muted h-3 w-1/2 rounded" />
              </div>
              <div className="bg-muted h-4 w-16 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = actions ?? [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Admin Actions</CardTitle>
          <p className="text-xs text-muted-foreground">Team audit trail (SSOT §2.3)</p>
        </div>
        <Activity className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent admin actions"
            description="Audit actions will appear here as staff perform administrative duties."
          />
        ) : (
          <div className="divide-y divide-border/50 text-sm">
            {items.slice(0, 10).map((act) => {
              const relTime = formatRelative(act.timestamp);
              const fullTime = formatDateTime(act.timestamp);

              return (
                <div key={act.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{act.actorEmail}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                        {act.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Target: <span className="text-foreground/90 font-medium">{act.target}</span>
                    </p>
                  </div>
                  <time
                    dateTime={act.timestamp}
                    title={fullTime}
                    className="text-xs text-muted-foreground shrink-0 cursor-help underline decoration-dotted underline-offset-2"
                  >
                    {relTime}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** 2. Recent Registrations Panel (SSOT §2.3) */
export function RecentRegistrationsPanel({
  registrations,
  loading = false,
}: {
  registrations?: UserRegistrationLog[] | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="bg-muted size-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-1 w-full">
                <div className="bg-muted h-3.5 w-1/2 rounded" />
                <div className="bg-muted h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = registrations ?? [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Registrations</CardTitle>
          <p className="text-xs text-muted-foreground">Newly onboarded users (SSOT §2.3)</p>
        </div>
        <UserPlus className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {items.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No recent registrations"
            description="Newly registered accounts will appear here as users sign up."
          />
        ) : (
          <div className="divide-y divide-border/50 text-sm">
            {items.slice(0, 10).map((user) => {
              const relTime = formatRelative(user.joinedAt);
              const fullTime = formatDate(user.joinedAt);
              const initials = getInitials(user.fullName);

              return (
                <div key={user.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-xs shrink-0 select-none">
                      {initials}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/users?id=${user.id}`}
                          className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm truncate"
                        >
                          {user.fullName}
                        </Link>
                        <StatusBadge status={user.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                        {user.universityName ? ` • ${user.universityName}` : ""}
                      </p>
                    </div>
                  </div>
                  <time
                    dateTime={user.joinedAt}
                    title={fullTime}
                    className="text-xs text-muted-foreground shrink-0 cursor-help underline decoration-dotted underline-offset-2"
                  >
                    {relTime}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Container rendering both Recent Activity panels side-by-side (SSOT §2.3, ADM-053).
 */
export function RecentActivityPanels({
  data,
  loading = false,
  className,
}: RecentActivityPanelsProps) {
  return (
    <div className={`grid gap-6 lg:grid-cols-2 ${className ?? ""}`}>
      <RecentAdminActionsPanel actions={data?.adminActions} loading={loading} />
      <RecentRegistrationsPanel registrations={data?.registrations} loading={loading} />
    </div>
  );
}
