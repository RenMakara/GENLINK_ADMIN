"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Search, ShieldCheck, UserRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { useAdminPermissionGroups, useAdminRole } from "@/services/roles";
import { useUserSearch } from "@/services/users";
import type { AdminPermissionGroup, AdminRoleSummary } from "@/types/admin-role";
import type { AdminUserTableRow } from "@/types/admin-user";

const MIN_SEARCH_LENGTH = 3;

export interface AdminInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: AdminRoleSummary[];
  rolesLoading?: boolean;
  rolesError?: boolean;
  currentRoleCode: string | null;
  canReadUsers: boolean;
  pending?: boolean;
  onPromote: (input: { userId: string; roleId: string; reason: string }) => Promise<void>;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function roleErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to read administrator roles.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The role service is unavailable. Nothing was changed.";
  }
  return "The selected role could not be loaded. Choose another role or close and refresh.";
}

function inviteErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "VALIDATION_ERROR":
      return "Only an existing, active, email-verified user without an admin profile can be promoted.";
    case "NOT_FOUND":
      return "The selected user or role is no longer available. Nothing was changed.";
    case "FORBIDDEN":
      return "You are not authorized to promote administrator accounts.";
    default:
      return error.status === 0
        ? "The administrator service is unavailable. Nothing was changed."
        : "The promotion could not be completed. Nothing was changed.";
  }
}

function roleGroupSummary(
  rolePermissions: string[],
  groups: AdminPermissionGroup[],
): Array<{ resource: string; count: number }> {
  const selected = new Set(rolePermissions);
  return groups
    .map((group) => ({
      resource: group.resource,
      count: group.permissions.filter((permission) => selected.has(permission.code)).length,
    }))
    .filter((group) => group.count > 0);
}

function CandidateRow({
  user,
  selected,
  onSelect,
}: {
  user: AdminUserTableRow;
  selected: boolean;
  onSelect: (user: AdminUserTableRow) => void;
}) {
  const alreadyAdmin = Boolean(user.adminRoleName);
  const selectable = user.emailVerified && !alreadyAdmin;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-disabled={!selectable}
      disabled={!selectable}
      onClick={() => onSelect(user)}
      className="flex w-full items-start gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserRound aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-foreground">
            {user.fullName || user.username || user.email}
          </span>
          {selected ? (
            <Badge variant="default">
              <Check aria-hidden="true" /> Selected
            </Badge>
          ) : null}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
      </span>
      <Badge variant={selectable ? "secondary" : "outline"}>
        {alreadyAdmin ? "Already admin" : user.emailVerified ? "Email verified" : "Email not verified"}
      </Badge>
    </button>
  );
}

function RolePermissionSummary({
  role,
  rolePermissions,
  groups,
  loading,
  error,
}: {
  role: AdminRoleSummary | undefined;
  rolePermissions: string[] | undefined;
  groups: AdminPermissionGroup[] | undefined;
  loading: boolean;
  error: unknown;
}) {
  if (!role) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
        Choose a role to review its permission groups before continuing.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin motion-reduce:animate-none" />
        Loading the role permission summary…
      </div>
    );
  }

  if (error || !rolePermissions || !groups) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Role summary unavailable</AlertTitle>
        <AlertDescription>{roleErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const summary = roleGroupSummary(rolePermissions, groups);

  return (
    <section
      aria-label={`${role.name} permission summary`}
      className="rounded-lg border border-border bg-muted/30 px-3 py-3"
    >
      <div className="flex items-start gap-2">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">What this role can do</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {role.description || "No description has been provided for this role."}
          </p>
          {summary.length > 0 ? (
            <ul className="mt-2 grid max-h-28 gap-1 overflow-y-auto text-xs sm:grid-cols-2">
              {summary.map((group) => (
                <li key={group.resource} className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">
                    {group.resource.toLowerCase() === "xp" ? "XP" : titleCase(group.resource)}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {group.count} {group.count === 1 ? "capability" : "capabilities"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">This role currently has no granted capabilities.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function AdminInviteDialog({
  open,
  onOpenChange,
  roles,
  rolesLoading = false,
  rolesError = false,
  currentRoleCode,
  canReadUsers,
  pending = false,
  onPromote,
}: AdminInviteDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserTableRow | null>(null);
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [open, search]);

  const searchable = canReadUsers && debouncedSearch.length >= MIN_SEARCH_LENGTH;
  const userSearch = useUserSearch(debouncedSearch, open && searchable);
  const availableRoles = useMemo(
    () => roles.filter((role) => currentRoleCode === "SUPER_ADMIN" || role.code !== "SUPER_ADMIN"),
    [currentRoleCode, roles],
  );
  const effectiveRoleId = availableRoles.some((role) => role.roleId === roleId) ? roleId : "";
  const selectedRole = availableRoles.find((role) => role.roleId === effectiveRoleId);
  const roleQuery = useAdminRole(effectiveRoleId, open && Boolean(effectiveRoleId) && !rolesError);
  const permissionQuery = useAdminPermissionGroups(open && !rolesError);
  const roleSummaryLoading =
    rolesLoading || roleQuery.isLoading || permissionQuery.isLoading;
  const roleSummaryError = roleQuery.error ?? (permissionQuery.isError ? permissionQuery.error : null);
  const results = userSearch.data?.content ?? [];

  const handleSelectUser = (user: AdminUserTableRow) => {
    if (!user.emailVerified || user.adminRoleName) return;
    setSelectedUser(user);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedUser(null);
      setRoleId("");
    }
    onOpenChange(nextOpen);
  };

  const canSubmit = Boolean(
    canReadUsers &&
      selectedUser?.emailVerified &&
      !selectedUser.adminRoleName &&
      selectedRole &&
      roleQuery.data &&
      permissionQuery.data &&
      !roleSummaryError,
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      contentClassName="max-h-[calc(100vh-2rem)] overflow-y-auto"
      tier="high"
      title="Promote an existing user to admin?"
      description="Only an active, email-verified user can receive administrator access."
      consequence={
        <span>
          <strong>{selectedUser?.email || "The selected user"}</strong> will receive the{" "}
          <strong>{selectedRole?.name || "selected role"}</strong> role. A fresh sudo verification
          is required, all details will be written to the admin audit log, and the new administrator
          must complete MFA enrolment before normal portal access.
        </span>
      }
      confirmLabel="Promote to admin"
      confirmTarget={selectedUser?.email || "the selected user's email"}
      confirmTargetLabel="email"
      pending={pending}
      confirmDisabled={!canSubmit || roleSummaryLoading}
      errorMessageFor={inviteErrorMessage}
      onConfirm={(reason) => {
        if (!selectedUser || !selectedRole) return Promise.resolve();
        return onPromote({ userId: selectedUser.userId, roleId: selectedRole.roleId, reason });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-invite-user-search">Search by email</Label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="admin-invite-user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="user@example.com"
            autoComplete="off"
            className="h-9 pl-9"
            disabled={!canReadUsers || pending}
            aria-describedby="admin-invite-user-search-help"
          />
        </div>
        <p id="admin-invite-user-search-help" className="text-xs text-muted-foreground">
          Enter at least {MIN_SEARCH_LENGTH} characters. Unverified users and existing admins cannot be selected.
        </p>
      </div>

      {!canReadUsers ? (
        <Alert variant="destructive">
          <AlertTitle>User search permission required</AlertTitle>
          <AlertDescription>
            Your role can manage administrators but cannot read user records, so no promotion can be started.
          </AlertDescription>
        </Alert>
      ) : null}

      {canReadUsers && searchable && userSearch.isError ? (
        <Alert variant="destructive">
          <AlertTitle>User search unavailable</AlertTitle>
          <AlertDescription>We could not search user records right now. Nothing was changed.</AlertDescription>
        </Alert>
      ) : null}

      {canReadUsers && searchable && !userSearch.isError ? (
        <div
          role="listbox"
          aria-label="Existing user search results"
          className="max-h-44 overflow-y-auto rounded-lg border border-border"
        >
          {userSearch.isLoading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin motion-reduce:animate-none" />
              Searching users…
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <CandidateRow
                key={user.userId}
                user={user}
                selected={selectedUser?.userId === user.userId}
                onSelect={handleSelectUser}
              />
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No matching users were found. Only existing, email-verified users can be promoted.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-invite-role">Admin role</Label>
        <select
          id="admin-invite-role"
          value={effectiveRoleId}
          onChange={(event) => setRoleId(event.target.value)}
          disabled={rolesLoading || rolesError || pending}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">Choose a role</option>
          {availableRoles.map((role) => (
            <option key={role.roleId} value={role.roleId}>
              {role.name} ({role.code})
            </option>
          ))}
        </select>
        {currentRoleCode !== "SUPER_ADMIN" ? (
          <p className="text-xs text-muted-foreground">
            SUPER_ADMIN is available only to an existing Super Admin.
          </p>
        ) : null}
      </div>

      <RolePermissionSummary
        role={selectedRole}
        rolePermissions={roleQuery.data?.permissions}
        groups={permissionQuery.data}
        loading={roleSummaryLoading}
        error={roleSummaryError}
      />
    </ConfirmDialog>
  );
}
