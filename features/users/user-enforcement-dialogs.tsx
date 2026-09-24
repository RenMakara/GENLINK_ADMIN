"use client";

import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Label } from "@/components/ui/label";

import {
  SUSPENSION_DURATION_OPTIONS,
  type UserEnforcementAction,
  userEnforcementErrorMessage,
} from "./user-enforcement";
import type { AdminUserDetail } from "./types";

export interface UserEnforcementDialogsProps {
  user: AdminUserDetail;
  action: UserEnforcementAction | null;
  pendingAction: UserEnforcementAction | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    action: UserEnforcementAction,
    reason: string,
    durationHours?: number,
  ) => Promise<void>;
}

function subjectName(user: AdminUserDetail): string {
  return user.fullName || (user.username ? `@${user.username}` : "this user");
}

export function UserEnforcementDialogs({
  user,
  action,
  pendingAction,
  onOpenChange,
  onConfirm,
}: UserEnforcementDialogsProps) {
  const durationId = useId();
  const [durationHours, setDurationHours] = useState<number>(SUSPENSION_DURATION_OPTIONS[0].value);
  const open = action !== null;
  const pending = pendingAction !== null;
  const name = subjectName(user);

  if (action === "ban") {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        tier="medium"
        title={`Ban ${name}?`}
        description="This is an immediate account-enforcement action."
        consequence="The account will be marked Banned, and the server will revoke active sessions before recording the reason in the audit log."
        confirmLabel="Ban user"
        pending={pending}
        errorMessageFor={userEnforcementErrorMessage}
        onConfirm={(reason) => onConfirm("ban", reason)}
      />
    );
  }

  if (action === "unban") {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        tier="medium"
        title={`Unban ${name}?`}
        description="This lifts the current ban after the server validates the sanction."
        consequence="The account will return to the status captured before the ban. The original enforcement record remains available to the audit trail."
        confirmLabel="Unban user"
        destructive={false}
        pending={pending}
        errorMessageFor={userEnforcementErrorMessage}
        onConfirm={(reason) => onConfirm("unban", reason)}
      />
    );
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Suspend ${name}?`}
      description="Suspension blocks account access for a defined period."
      consequence="The account will be marked Suspended and active sessions will be revoked. The server will restore the captured previous status when the suspension expires."
      confirmLabel="Suspend user"
      pending={pending}
      errorMessageFor={userEnforcementErrorMessage}
      onConfirm={(reason) => onConfirm("suspend", reason, durationHours)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={durationId}>Suspension duration</Label>
        <select
          id={durationId}
          aria-describedby={`${durationId}-hint`}
          value={durationHours}
          onChange={(event) => setDurationHours(Number(event.currentTarget.value))}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending}
        >
          {SUSPENSION_DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p id={`${durationId}-hint`} className="text-xs text-muted-foreground">
          The fixed duration set is 24 hours, 7 days, or 30 days.
        </p>
      </div>
    </ConfirmDialog>
  );
}
