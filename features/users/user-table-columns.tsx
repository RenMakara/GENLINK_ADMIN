"use client";

/*
 * User avatars are runtime URLs supplied by the API (including S3-compatible storage hosts).
 * They cannot be safely enumerated in next.config.ts for next/image, so this feature uses a
 * native lazy image with an initials fallback. The image is decorative because the adjacent
 * user name is the accessible identity.
 */
/* eslint-disable @next/next/no-img-element */

import type { SortingState } from "@tanstack/react-table";
import { AlertTriangle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableColumnDef } from "@/components/data-table";
import { formatDateTime, formatRelative } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

import type { AdminUserTableRow, UserWorkStatus } from "./types";

/** Server-sortable IDs accepted by ADM-061 and consumed by ADM-068. */
export const USER_TABLE_SORTABLE_COLUMN_IDS = [
  "fullName",
  "email",
  "universityName",
  "totalXp",
  "createdAt",
  "lastActiveAt",
] as const;

export type UserTableSortableColumnId = (typeof USER_TABLE_SORTABLE_COLUMN_IDS)[number];

/** The SSOT default: newest registrations first, with the URL hook owning later changes. */
export const DEFAULT_USER_TABLE_SORTING: SortingState = [{ id: "createdAt", desc: true }];

const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");

const WORK_STATUS_LABELS: Record<UserWorkStatus, string> = {
  STUDENT: "Student",
  FRESH_GRADUATE: "Fresh graduate",
  YOUNG_PROFESSIONAL: "Young professional",
  CREATOR: "Creator",
  FREELANCER: "Freelancer",
  ENTREPRENEUR: "Entrepreneur",
  OTHER: "Other",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function formatWorkStatus(status: UserWorkStatus | null | undefined): string {
  return status ? WORK_STATUS_LABELS[status] : "—";
}

function UserAvatar({ user }: { user: AdminUserTableRow }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getInitials(user.fullName);

  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-accent-foreground"
    >
      {user.avatarUrl && !imageFailed ? (
        <img
          src={user.avatarUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

function UserIdentityCell({ user }: { user: AdminUserTableRow }) {
  const username = user.username ? `@${user.username.replace(/^@/, "")}` : "—";

  return (
    <div className="flex min-w-48 items-center gap-3">
      <UserAvatar user={user} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{user.fullName || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{username}</p>
      </div>
    </div>
  );
}

function EmailVerificationIndicator({ verified }: { verified: boolean }) {
  const label = verified ? "Email verified" : "Email not verified";
  const Icon = verified ? CheckCircle2 : AlertTriangle;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-flex shrink-0", verified ? "text-success" : "text-warning")}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

function EmailCell({ user }: { user: AdminUserTableRow }) {
  return (
    <div className="flex min-w-48 items-center gap-1.5">
      <span className="truncate" title={user.email}>
        {user.email || "—"}
      </span>
      <EmailVerificationIndicator verified={user.emailVerified} />
    </div>
  );
}

function RoleCell({ user }: { user: AdminUserTableRow }) {
  const role = user.adminRoleName?.trim();
  return role ? (
    <Badge variant="outline" className="max-w-36 truncate" title={role}>
      {role}
    </Badge>
  ) : (
    <span className="text-muted-foreground" aria-label="No admin role">
      —
    </span>
  );
}

function TextCell({ value }: { value: string | null | undefined }) {
  return (
    <span className="block max-w-56 truncate" title={value || undefined}>
      {value || "—"}
    </span>
  );
}

function TimestampCell({ value, now }: { value: string | null | undefined; now?: Date }) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  const relative = now ? formatRelative(value, now) : formatRelative(value);
  const absolute = formatDateTime(value);

  return (
    <time
      dateTime={value}
      title={absolute}
      className="cursor-help whitespace-nowrap text-muted-foreground underline decoration-dotted underline-offset-2"
    >
      {relative}
    </time>
  );
}

function LevelXpCell({ user }: { user: AdminUserTableRow }) {
  return (
    <span className="tabular-nums whitespace-nowrap">
      <span className="font-medium text-foreground">Lv {user.level}</span>
      <span aria-hidden="true"> · </span>
      <span>{INTEGER_FORMATTER.format(user.totalXp)} XP</span>
    </span>
  );
}

export interface UserTableColumnOptions {
  /** Injectable clock for deterministic tests; production callers may omit it. */
  now?: Date;
}

/**
 * The nine feature-owned data columns. Selection and actions are supplied by the generic
 * `DataTable` shell so they keep the same semantics across every admin list.
 */
export function createUserTableColumns({ now }: UserTableColumnOptions = {}): DataTableColumnDef<AdminUserTableRow>[] {
  return [
    {
      accessorKey: "fullName",
      header: "User",
      enableSorting: true,
      cell: ({ row }) => <UserIdentityCell user={row.original} />,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
      cell: ({ row }) => <EmailCell user={row.original} />,
    },
    {
      accessorKey: "accountStatus",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.original.accountStatus} />,
    },
    {
      accessorKey: "adminRoleName",
      header: "Role",
      enableSorting: false,
      cell: ({ row }) => <RoleCell user={row.original} />,
    },
    {
      accessorKey: "universityName",
      header: "University",
      enableSorting: true,
      cell: ({ row }) => <TextCell value={row.original.universityName} />,
    },
    {
      accessorKey: "workStatus",
      header: "Work status",
      enableSorting: false,
      cell: ({ row }) => <TextCell value={formatWorkStatus(row.original.workStatus)} />,
    },
    {
      accessorKey: "totalXp",
      header: "Level / XP",
      enableSorting: true,
      cell: ({ row }) => <LevelXpCell user={row.original} />,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      enableSorting: true,
      cell: ({ row }) => <TimestampCell value={row.original.createdAt} now={now} />,
    },
    {
      accessorKey: "lastActiveAt",
      header: "Last active",
      enableSorting: true,
      cell: ({ row }) => <TimestampCell value={row.original.lastActiveAt} now={now} />,
    },
  ];
}

export interface UserTableRowActionsProps {
  user: AdminUserTableRow;
  onViewDetails: (user: AdminUserTableRow) => void;
}

/**
 * Feature-owned action menu used with `DataTable`'s `rowActions` slot. Destructive actions are
 * intentionally absent until their permission and confirmation work lands in Phase 4.
 */
export function UserTableRowActions({ user, onViewDetails }: UserTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-data-table-interactive
          aria-label={`Open actions for ${user.fullName}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onViewDetails(user)}>View user details</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type UserTableActionRenderer = (user: AdminUserTableRow) => ReactNode;
