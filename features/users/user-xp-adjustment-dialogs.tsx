"use client";

import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  projectXpState,
  type UserXpAdjustmentAction,
  userXpAdjustmentErrorMessage,
} from "./user-xp-adjustment";
import type { AdminUserDetail } from "./types";

export interface UserXpAdjustmentDialogsProps {
  user: AdminUserDetail;
  action: UserXpAdjustmentAction | null;
  pendingAction: UserXpAdjustmentAction | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (action: UserXpAdjustmentAction, amount: number, reason: string) => Promise<void>;
}

function subjectName(user: AdminUserDetail): string {
  return user.fullName || (user.username ? `@${user.username}` : "this user");
}

function amountError(action: UserXpAdjustmentAction, amountText: string): string | null {
  if (amountText.trim() === "") return "Enter a whole-number XP amount.";

  const amount = Number(amountText);
  if (!Number.isInteger(amount) || amount === 0) {
    return "Enter a non-zero whole-number XP amount.";
  }
  if (action === "grant-xp" && amount < 1) return "Grant amount must be positive.";
  if (action === "revoke-xp" && amount > -1) return "Remove amount must be negative.";
  return null;
}

function XpAdjustmentDialog({
  user,
  action,
  pendingAction,
  onOpenChange,
  onConfirm,
}: Omit<UserXpAdjustmentDialogsProps, "action"> & { action: UserXpAdjustmentAction }) {
  const defaultAmount = action === "grant-xp" ? "100" : "-100";
  const [amountText, setAmountText] = useState(defaultAmount);
  const amountId = useId();
  const pending = pendingAction !== null;
  const error = amountError(action, amountText);
  const amount = Number(amountText);
  const validAmount = error === null;
  const projected = projectXpState(user.totalXp, validAmount ? amount : 0);
  const name = subjectName(user);
  const isGrant = action === "grant-xp";

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="medium"
      title={`${isGrant ? "Grant" : "Remove"} XP ${isGrant ? "to" : "from"} ${name}?`}
      description="This signed adjustment is recorded in the audit log and XP ledger."
      consequence={
        isGrant
          ? "The user will receive the amount shown below, and their level may increase."
          : "The user will lose the amount shown below, floored at zero XP, and their level may decrease."
      }
      confirmLabel={isGrant ? "Grant XP" : "Remove XP"}
      destructive={!isGrant}
      pending={pending}
      confirmDisabled={!validAmount}
      errorMessageFor={userXpAdjustmentErrorMessage}
      onConfirm={(reason) => onConfirm(action, amount, reason)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={amountId}>XP amount</Label>
        <Input
          id={amountId}
          type="number"
          inputMode="numeric"
          step={1}
          min={isGrant ? 1 : undefined}
          max={isGrant ? undefined : -1}
          value={amountText}
          onChange={(event) => setAmountText(event.currentTarget.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${amountId}-hint${error ? ` ${amountId}-error` : ""}`}
          disabled={pending}
        />
        <p id={`${amountId}-hint`} className="text-xs text-muted-foreground">
          {isGrant ? "Use a positive whole number." : "Use a negative whole number."}
        </p>
        {error ? (
          <p id={`${amountId}-error`} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Preview after this adjustment</p>
          <p className="mt-1 text-muted-foreground">
            Total XP: <span className="font-medium text-foreground">{projected.totalXp}</span>
            {" · "}
            Level: <span className="font-medium text-foreground">{projected.level}</span>
          </p>
        </div>
      </div>
    </ConfirmDialog>
  );
}

/** The ADM-094 grant/remove XP dialogs, composed from the shared confirmation primitive. */
export function UserXpAdjustmentDialogs({ action, ...props }: UserXpAdjustmentDialogsProps) {
  if (!action) return null;
  return <XpAdjustmentDialog key={action} action={action} {...props} />;
}
