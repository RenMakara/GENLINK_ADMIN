"use client";

import {
  Ban,
  FileText,
  KeyRound,
  LogOut,
  MailCheck,
  MoreHorizontal,
  PauseCircle,
  RotateCcw,
  StickyNote,
  Trash2,
  UserRoundCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permission";
import { type Permission } from "@/types/permissions";

import type { AdminUserDetail } from "./types";

const ANONYMISATION_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/** Action identifiers handed to the action-specific dialog tasks. */
export type UserAction =
  | "ban"
  | "unban"
  | "suspend"
  | "verify-email"
  | "reset-password"
  | "force-logout"
  | "delete"
  | "restore"
  | "grant-xp"
  | "revoke-xp"
  | "warn"
  | "add-note";

export interface UserActionDefinition {
  id: UserAction;
  label: string;
  permission: Permission;
}

export interface UserActionClusterModel {
  primary: UserActionDefinition[];
  overflow: UserActionDefinition[];
  statusMessage?: string;
}

export interface UserActionClusterProps {
  user: AdminUserDetail;
  /** Action dialogs wire this callback in ADM-091 onward. */
  onAction?: (action: UserAction) => void;
}

/**
 * The API currently exposes deletion time rather than a separate anonymised flag. The
 * anonymisation job runs after the documented 30-day grace period, so an old soft-deletion is
 * the client-safe signal for suppressing Restore. Invalid/future timestamps remain restorable
 * rather than being treated as irreversible by mistake.
 */
export function isAnonymisedAccount(user: AdminUserDetail, now = Date.now()): boolean {
  if (user.accountStatus !== "DELETED" || !user.deletedAt) return false;

  const deletedAt = Date.parse(user.deletedAt);
  return Number.isFinite(deletedAt) && now - deletedAt >= ANONYMISATION_GRACE_PERIOD_MS;
}

function action(
  id: UserAction,
  label: string,
  permission: Permission,
): UserActionDefinition {
  return { id, label, permission };
}

function hasPermission(permissions: readonly Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}

/**
 * Derives the detail-header controls without knowing anything about the eventual mutations.
 * Server-side authorization remains authoritative; this model only avoids rendering controls
 * that would be invalid for the current account state or would immediately return 403.
 */
export function getUserActionClusterModel(
  user: AdminUserDetail,
  permissions: readonly Permission[],
  now = Date.now(),
): UserActionClusterModel {
  if (isAnonymisedAccount(user, now)) {
    return {
      primary: [],
      overflow: [],
      statusMessage: "Anonymised — cannot be restored",
    };
  }

  if (user.accountStatus === "DELETED") {
    return {
      primary: [],
      overflow: hasPermission(permissions, "user:delete")
        ? [action("restore", "Restore account", "user:delete")]
        : [],
    };
  }

  const primary: UserActionDefinition[] = [];
  const overflow: UserActionDefinition[] = [];

  if (user.accountStatus === "BANNED") {
    if (hasPermission(permissions, "user:unban")) {
      primary.push(action("unban", "Unban", "user:unban"));
    }
  } else if (hasPermission(permissions, "user:ban")) {
    primary.push(action("ban", "Ban", "user:ban"));
  }

  if (
    user.accountStatus !== "BANNED" &&
    user.accountStatus !== "SUSPENDED" &&
    hasPermission(permissions, "user:suspend")
  ) {
    overflow.push(action("suspend", "Suspend", "user:suspend"));
  }

  if (!user.emailVerified && hasPermission(permissions, "user:verify_email")) {
    overflow.push(action("verify-email", "Verify email", "user:verify_email"));
  }
  if (hasPermission(permissions, "user:reset_password")) {
    overflow.push(action("reset-password", "Reset password", "user:reset_password"));
  }
  if (hasPermission(permissions, "user:force_logout")) {
    overflow.push(action("force-logout", "Force logout", "user:force_logout"));
  }
  if (hasPermission(permissions, "user:delete")) {
    overflow.push(action("delete", "Delete account", "user:delete"));
  }
  if (hasPermission(permissions, "xp:grant")) {
    overflow.push(action("grant-xp", "Grant XP", "xp:grant"));
  }
  if (hasPermission(permissions, "xp:revoke")) {
    overflow.push(action("revoke-xp", "Remove XP", "xp:revoke"));
  }
  if (hasPermission(permissions, "user:warn")) {
    overflow.push(action("warn", "Issue warning", "user:warn"));
  }
  if (hasPermission(permissions, "user:note:write")) {
    overflow.push(action("add-note", "Add note", "user:note:write"));
  }

  return { primary, overflow };
}

const actionIcons = {
  ban: Ban,
  unban: UserRoundCheck,
  suspend: PauseCircle,
  "verify-email": MailCheck,
  "reset-password": KeyRound,
  "force-logout": LogOut,
  delete: Trash2,
  restore: RotateCcw,
  "grant-xp": Zap,
  "revoke-xp": Zap,
  warn: FileText,
  "add-note": StickyNote,
} satisfies Record<UserAction, typeof Ban>;

function ActionIcon({ actionId }: { actionId: UserAction }) {
  const Icon = actionIcons[actionId];
  return <Icon aria-hidden="true" />;
}

export function UserActionCluster({ user, onAction }: UserActionClusterProps) {
  const { permissions } = usePermissions();
  const model = getUserActionClusterModel(user, permissions ?? []);

  const handleAction = (selected: UserActionDefinition) => {
    onAction?.(selected.id);
  };

  return (
    <div
      data-testid="user-detail-action-cluster"
      aria-label="User actions"
      className="flex min-h-9 min-w-12 shrink-0 flex-wrap items-center justify-end gap-2"
    >
      {model.statusMessage ? (
        <span
          role="status"
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {model.statusMessage}
        </span>
      ) : null}

      {model.primary.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={item.id === "ban" ? "destructive" : "outline"}
          size="sm"
          onClick={() => handleAction(item)}
        >
          <ActionIcon actionId={item.id} />
          {item.label}
        </Button>
      ))}

      {model.overflow.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More user actions"
              title="More user actions"
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {model.overflow.map((item) => (
              <DropdownMenuItem key={item.id} onSelect={() => handleAction(item)}>
                <ActionIcon actionId={item.id} />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
