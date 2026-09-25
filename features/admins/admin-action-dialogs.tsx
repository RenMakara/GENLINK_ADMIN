"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import type { AdminRoleSummary } from "@/types/admin-role";
import type { AdminStaff } from "@/types/admin-staff";

export type AdminAction = "change-role" | "deactivate" | "reset-mfa";

export interface AdminActionDialogProps {
  action: AdminAction | null;
  admin: AdminStaff | null;
  roles: AdminRoleSummary[];
  rolesLoading?: boolean;
  rolesError?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeRole: (roleId: string, reason: string) => Promise<void>;
  onDeactivate: (reason: string) => Promise<void>;
  onResetMfa: (reason: string) => Promise<void>;
}

export function adminActionErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "ADMIN_SELF_MODIFICATION":
      return "You cannot change your own administrator role or active state.";
    case "ADMIN_LAST_SUPER_ADMIN":
      return "This is the last Super Admin. Appoint another Super Admin before changing this account.";
    case "FORBIDDEN":
      return "You are not authorized to manage administrator accounts.";
    case "VALIDATION_ERROR":
      return "Check the selected role and provide an audit reason with at least 10 characters.";
    case "NOT_FOUND":
      return "This administrator is no longer available. Nothing was changed.";
    default:
      return error.status === 0
        ? "The administrator service is unavailable. Nothing was changed."
        : "The administrator action could not be completed. Nothing was changed.";
  }
}

function targetFor(admin: AdminStaff): string {
  return admin.email || admin.username || admin.fullName;
}

interface RoleChangeDialogProps {
  admin: AdminStaff;
  roles: AdminRoleSummary[];
  rolesLoading?: boolean;
  rolesError?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (roleId: string, reason: string) => Promise<void>;
}

function RoleChangeDialog({
  admin,
  roles,
  rolesLoading = false,
  rolesError = false,
  pending = false,
  onOpenChange,
  onConfirm,
}: RoleChangeDialogProps) {
  const [roleId, setRoleId] = useState(admin.roleId ?? "");
  const selectedRole = roles.find((role) => role.roleId === roleId);

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="high"
      title={`Change ${admin.fullName || "this admin"}'s role?`}
      description="Role changes take effect after the target signs in again."
      consequence={
        <span>
          The administrator will receive the <strong>{selectedRole?.name ?? "selected role"}</strong> role,
          all active sessions will be revoked, and the change will be written to the admin audit log.
        </span>
      }
      confirmLabel="Change role"
      confirmTarget={targetFor(admin)}
      confirmTargetLabel="email"
      pending={pending}
      confirmDisabled={
        rolesLoading || rolesError || !roleId || roleId === admin.roleId || !selectedRole
      }
      errorMessageFor={adminActionErrorMessage}
      onConfirm={(reason) => onConfirm(roleId, reason)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-role-change">New role</Label>
        <select
          id="admin-role-change"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          disabled={rolesLoading || rolesError || pending}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">{rolesLoading ? "Loading roles…" : "Choose a role"}</option>
          {roles.map((role) => (
            <option key={role.roleId} value={role.roleId}>
              {role.name} ({role.code})
            </option>
          ))}
        </select>
        {rolesError ? (
          <p role="alert" className="text-sm text-destructive">
            Roles could not be loaded. Close this dialog and refresh the page.
          </p>
        ) : null}
      </div>
    </ConfirmDialog>
  );
}

interface SimpleAdminActionDialogProps {
  admin: AdminStaff;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}

function DeactivateDialog({
  admin,
  pending = false,
  onOpenChange,
  onConfirm,
}: SimpleAdminActionDialogProps) {
  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="high"
      title={`Deactivate ${admin.fullName || "this admin"}?`}
      description="This revokes staff access while preserving the linked GenLink user account."
      consequence="Admin access will be revoked, every active session will be signed out, and the action will be recorded in the admin audit log."
      confirmLabel="Deactivate admin"
      confirmTarget={targetFor(admin)}
      confirmTargetLabel="email"
      pending={pending}
      errorMessageFor={adminActionErrorMessage}
      onConfirm={onConfirm}
    />
  );
}

function ResetMfaDialog({
  admin,
  pending = false,
  onOpenChange,
  onConfirm,
}: SimpleAdminActionDialogProps) {
  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="high"
      title={`Reset MFA for ${admin.fullName || "this admin"}?`}
      description="Use this only when the administrator cannot complete their current two-factor sign-in."
      consequence="The current authenticator and recovery codes will be cleared, active sessions will be revoked, and the administrator must enrol MFA again at the next sign-in."
      confirmLabel="Reset MFA"
      confirmTarget={targetFor(admin)}
      confirmTargetLabel="email"
      pending={pending}
      errorMessageFor={adminActionErrorMessage}
      onConfirm={onConfirm}
    />
  );
}

/** The three ADM-111 row-action confirmations share the audited confirmation primitive. */
export function AdminActionDialogs({
  action,
  admin,
  roles,
  rolesLoading,
  rolesError,
  pending,
  onOpenChange,
  onChangeRole,
  onDeactivate,
  onResetMfa,
}: AdminActionDialogProps) {
  if (!action || !admin) return null;

  if (action === "change-role") {
    return (
      <RoleChangeDialog
        key={`${admin.adminId}-change-role`}
        admin={admin}
        roles={roles}
        rolesLoading={rolesLoading}
        rolesError={rolesError}
        pending={pending}
        onOpenChange={onOpenChange}
        onConfirm={onChangeRole}
      />
    );
  }

  if (action === "deactivate") {
    return (
      <DeactivateDialog
        key={`${admin.adminId}-deactivate`}
        admin={admin}
        pending={pending}
        onOpenChange={onOpenChange}
        onConfirm={onDeactivate}
      />
    );
  }

  return (
    <ResetMfaDialog
      key={`${admin.adminId}-reset-mfa`}
      admin={admin}
      pending={pending}
      onOpenChange={onOpenChange}
      onConfirm={onResetMfa}
    />
  );
}
