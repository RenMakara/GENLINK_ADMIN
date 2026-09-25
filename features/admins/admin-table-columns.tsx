"use client";

import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import type { DataTableColumnDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRelative } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { AdminStaff } from "@/types/admin-staff";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function AdminIdentityCell({ admin }: { admin: AdminStaff }) {
  const username = admin.username ? `@${admin.username.replace(/^@/, "")}` : "—";

  return (
    <div className="flex min-w-48 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
      >
        {getInitials(admin.fullName)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{admin.fullName || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{username}</p>
      </div>
    </div>
  );
}

function EmailCell({ email }: { email: string }) {
  return (
    <span className="block min-w-52 truncate" title={email || undefined}>
      {email || "—"}
    </span>
  );
}

function RoleCell({ admin }: { admin: AdminStaff }) {
  const role = admin.roleName || admin.roleCode;
  return role ? (
    <Badge variant="outline" className="max-w-40 truncate" title={admin.roleCode ?? role}>
      {role}
    </Badge>
  ) : (
    <span className="text-muted-foreground" aria-label="No admin role">
      —
    </span>
  );
}

function MfaStatusCell({ admin }: { admin: AdminStaff }) {
  const confirmed = admin.totpEnabled && admin.totpConfirmed;
  const enabledButUnconfirmed = admin.totpEnabled && !admin.totpConfirmed;
  const label = confirmed
    ? "2FA confirmed"
    : enabledButUnconfirmed
      ? "2FA setup pending"
      : "2FA not enrolled";
  const Icon = confirmed ? ShieldCheck : enabledButUnconfirmed ? Clock3 : AlertTriangle;

  return (
    <Badge
      variant={confirmed ? "outline" : enabledButUnconfirmed ? "secondary" : "destructive"}
      className={cn(
        "gap-1.5",
        confirmed && "border-success/40 bg-success/10 text-success",
        enabledButUnconfirmed && "border-warning/40 bg-warning/10 text-warning",
      )}
      title={label}
    >
      <Icon aria-hidden="true" />
      {confirmed ? "Confirmed" : enabledButUnconfirmed ? "Setup pending" : "Not enrolled"}
    </Badge>
  );
}

function LastLoginCell({ value, now }: { value: string | null; now?: Date }) {
  if (!value) return <span className="text-muted-foreground">Never</span>;

  return (
    <time
      dateTime={value}
      title={formatDateTime(value)}
      className="cursor-help whitespace-nowrap text-muted-foreground underline decoration-dotted underline-offset-2"
    >
      {now ? formatRelative(value, now) : formatRelative(value)}
    </time>
  );
}

function ActiveStatusCell({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-success text-success-foreground">
      <CheckCircle2 aria-hidden="true" />
      Active
    </Badge>
  ) : (
    <Badge variant="destructive">Revoked</Badge>
  );
}

export interface AdminTableColumnOptions {
  /** Injectable clock keeps relative-time tests deterministic. */
  now?: Date;
}

/** Feature-owned columns for the ADM-109 staff directory. */
export function createAdminTableColumns({ now }: AdminTableColumnOptions = {}): DataTableColumnDef<AdminStaff>[] {
  return [
    {
      accessorKey: "fullName",
      header: "Admin",
      enableSorting: false,
      cell: ({ row }) => <AdminIdentityCell admin={row.original} />,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: false,
      cell: ({ row }) => <EmailCell email={row.original.email} />,
    },
    {
      accessorKey: "roleName",
      header: "Role",
      enableSorting: false,
      cell: ({ row }) => <RoleCell admin={row.original} />,
    },
    {
      accessorKey: "totpConfirmed",
      header: "2FA status",
      enableSorting: false,
      cell: ({ row }) => <MfaStatusCell admin={row.original} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last login",
      enableSorting: false,
      cell: ({ row }) => <LastLoginCell value={row.original.lastLoginAt} now={now} />,
    },
    {
      accessorKey: "active",
      header: "State",
      enableSorting: false,
      cell: ({ row }) => <ActiveStatusCell active={row.original.active} />,
    },
  ];
}
