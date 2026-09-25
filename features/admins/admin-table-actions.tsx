"use client";

import { MoreHorizontal, Pencil, ShieldOff, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminStaff } from "@/types/admin-staff";

import type { AdminAction } from "./admin-action-dialogs";

export interface AdminTableRowActionsProps {
  admin: AdminStaff;
  currentAdminId: string | null;
  canManage: boolean;
  onAction: (action: AdminAction, admin: AdminStaff) => void;
}

/** Row actions are hidden for viewers, revoked profiles, and the signed-in admin. */
export function AdminTableRowActions({
  admin,
  currentAdminId,
  canManage,
  onAction,
}: AdminTableRowActionsProps) {
  if (!canManage) return null;

  if (!admin.active) {
    return (
      <span className="text-xs text-muted-foreground" aria-label="No actions for revoked admin">
        —
      </span>
    );
  }

  if (admin.adminId === currentAdminId) {
    return (
      <span className="text-right text-xs text-muted-foreground" aria-label="Current admin account">
        Current account
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-data-table-interactive
          aria-label={`Open actions for ${admin.fullName || admin.email}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction("change-role", admin)}>
          <Pencil aria-hidden="true" />
          Change role
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("reset-mfa", admin)}>
          <Smartphone aria-hidden="true" />
          Reset MFA
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onAction("deactivate", admin)}>
          <ShieldOff aria-hidden="true" />
          Deactivate admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
