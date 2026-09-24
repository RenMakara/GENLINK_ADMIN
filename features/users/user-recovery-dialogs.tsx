"use client";

import { ConfirmDialog } from "@/components/common";

import {
  type UserRecoveryAction,
  userRecoveryErrorMessage,
} from "./user-recovery";
import type { AdminUserDetail } from "./types";

export interface UserRecoveryDialogsProps {
  user: AdminUserDetail;
  action: UserRecoveryAction | null;
  pendingAction: UserRecoveryAction | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (action: UserRecoveryAction, reason: string) => Promise<void>;
}

function subjectName(user: AdminUserDetail): string {
  return user.fullName || (user.username ? `@${user.username}` : "this user");
}

/** The ADM-092 recovery dialogs, composed from the shared confirmation primitive. */
export function UserRecoveryDialogs({
  user,
  action,
  pendingAction,
  onOpenChange,
  onConfirm,
}: UserRecoveryDialogsProps) {
  if (!action || (action === "verify-email" && user.emailVerified)) return null;

  const pending = pendingAction !== null;
  const name = subjectName(user);

  if (action === "verify-email") {
    return (
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        tier="low"
        title={`Verify ${name}'s email?`}
        description="This marks the address as verified for the selected account."
        consequence="The account's email will be marked verified. A pending account will become Active; no email is sent."
        confirmLabel="Verify email"
        destructive={false}
        pending={pending}
        errorMessageFor={userRecoveryErrorMessage}
        onConfirm={(reason) => onConfirm("verify-email", reason)}
      />
    );
  }

  if (action === "reset-password") {
    return (
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        tier="low"
        title={`Send a password reset email to ${name}?`}
        description="The user completes the reset through the normal email flow."
        consequence="GenLink will send a password-reset email to the address on this account. You will not see or set the user's password."
        confirmLabel="Send reset email"
        destructive={false}
        pending={pending}
        errorMessageFor={userRecoveryErrorMessage}
        onConfirm={(reason) => onConfirm("reset-password", reason)}
      />
    );
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Force logout ${name}?`}
      description="This immediately revokes the account's active sessions."
      consequence="Every device will be signed out, refresh sessions will be revoked, and the user must sign in again."
      confirmLabel="Force logout"
      pending={pending}
      errorMessageFor={userRecoveryErrorMessage}
      onConfirm={(reason) => onConfirm("force-logout", reason)}
    />
  );
}
