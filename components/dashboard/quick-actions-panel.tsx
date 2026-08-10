"use client";

import Link from "next/link";
import { Download, Search, UserCheck, UserPlus, Zap } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/permissions";

export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  permission: Permission;
  href: string;
  icon: ComponentType<LucideProps>;
}

export const MVP_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "search-user",
    label: "Search user",
    description: "Search user accounts",
    permission: "user:read",
    href: "/users?focus=search",
    icon: Search,
  },
  {
    id: "verify-user",
    label: "Review pending verifications",
    description: "Verify pending student accounts",
    permission: "user:verify_email",
    href: "/users?status=PENDING",
    icon: UserCheck,
  },
  {
    id: "export-user",
    label: "Export user list",
    description: "Download CSV user export",
    permission: "user:export",
    href: "/users?action=export",
    icon: Download,
  },
  {
    id: "invite-admin",
    label: "Invite admin",
    description: "Onboard new administrator",
    permission: "rbac:manage",
    href: "/roles?action=invite",
    icon: UserPlus,
  },
];

export interface QuickActionsPanelProps {
  /** Optional explicit permission array for isolated unit testing */
  userPermissions?: string[] | null;
  /** True while auth state is loading */
  loading?: boolean;
  /** Container CSS class name */
  className?: string;
}

/**
 * A compact panel of high-frequency tasks (SSOT §2.4, ADM-054).
 *
 * <p>Each action is rendered only if the viewer holds its required permission code. Phase 7
 * and Phase 8 actions ("Review report queue", "Send broadcast notification") are omitted until
 * their feature phases ship.
 */
export function QuickActionsPanel({
  userPermissions,
  loading = false,
  className,
}: QuickActionsPanelProps) {
  // Read permissions from context if explicit prop is not passed
  let activePermissions: string[] | null = null;
  try {
    const auth = useAuth();
    activePermissions = userPermissions ?? auth.permissions;
  } catch {
    activePermissions = userPermissions ?? null;
  }

  const effectivePermissions = activePermissions ?? [];

  const visibleActions = MVP_QUICK_ACTIONS.filter((action) =>
    effectivePermissions.includes(action.permission),
  );

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="animate-pulse bg-muted h-16 rounded-lg border border-border/50" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          <p className="text-xs text-muted-foreground">Permission-gated staff workflows (SSOT §2.4)</p>
        </div>
        <Zap className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        {visibleActions.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No quick actions available"
            description="Your role does not carry permissions for the available quick actions."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={cn(
                    "group flex items-start gap-3 p-3 rounded-lg border border-border bg-card",
                    "hover:bg-accent/40 hover:border-accent-foreground/30 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  aria-label={action.label}
                >
                  <div className="size-8 rounded-md bg-accent text-accent-foreground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-0.5">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {action.label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
