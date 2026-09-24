"use client";

import { ConfirmDialog } from "@/components/common";

import { isAnonymisedAccount } from "./user-action-cluster";
import {
  type UserLifecycleAction,
  userLifecycleErrorMessage,
} from "./user-lifecycle";
import type { AdminUserDetail } from "./types";

export interface UserLifecycleDialogsProps {
  user: AdminUserDetail;
  action: UserLifecycleAction | null;
  pendingAction: UserLifecycleAction | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (action: UserLifecycleAction, reason: string) => Promise<void>;
}

function subjectName(user: AdminUserDetail): string {
  return user.fullName || (user.username ? `@${user.username}` : "this user");
}

/** The ADM-093 high-tier delete and restore dialogs. */
export function UserLifecycleDialogs({
  user,
  action,
  pendingAction,
  onOpenChange,
  onConfirm,
}: UserLifecycleDialogsProps) {
  // The action cluster explains this state. This guard also prevents a stale dialog from offering
  // a restore after the 30-day anonymisation boundary has passed.
  if (!action || (action === "restore" && isAnonymisedAccount(user))) return null;

  const pending = pendingAction !== null;
  const name = subjectName(user);
  const target = user.username;

  if (action === "delete") {
    return (
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        tier="high"
        title={`Delete ${name}?`}
        description="This starts the account's reversible deletion period."
        consequence="The account will be soft-deleted, active sessions will be revoked, and it can be restored for 30 days. After that grace period, anonymisation is irreversible."
        confirmLabel="Delete account"
        confirmTarget={target}
        confirmTargetLabel="username"
        pending={pending}
        errorMessageFor={userLifecycleErrorMessage}
        onConfirm={(reason) => onConfirm("delete", reason)}
      />
    );
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="high"
      title={`Restore ${name}?`}
      description="This reverses a soft deletion during the 30-day grace period."
      consequence="The account will leave Deleted status and return to the status captured before deletion. Restore is unavailable after anonymisation."
      confirmLabel="Restore account"
      confirmTarget={target}
      confirmTargetLabel="username"
      destructive={false}
      pending={pending}
      errorMessageFor={userLifecycleErrorMessage}
      onConfirm={(reason) => onConfirm("restore", reason)}
    />
  );
}
