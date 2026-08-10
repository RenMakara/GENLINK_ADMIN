"use client";

import { useId, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { confirmGate, type ConfirmTier } from "@/lib/ui/confirm";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: ConfirmTier;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  /** High tier only: the exact string the operator must type (username or email). */
  confirmTarget?: string;
  /** What that string is, for the prompt — "email", "username". */
  confirmTargetLabel?: string;
  /** Draw the confirm button as destructive. Defaults on for medium and high tiers. */
  destructive?: boolean;
  /** The action is in flight — disables the button and shows a working label. */
  pending?: boolean;
  /** Called with the trimmed reason ("" for low tier). The caller closes on success. */
  onConfirm: (reason: string) => void;
}

/**
 * The confirmation in front of a sensitive action (ADM-040, SSOT §10.7).
 *
 * <h2>Three tiers, one component</h2>
 *
 * The `tier` decides how much friction stands between the click and the action:
 *
 * <ul>
 *   <li><strong>low</strong> — a plain "are you sure".</li>
 *   <li><strong>medium</strong> — plus a mandatory reason, which the caller writes to the audit
 *       log. Ten characters, trimmed (SSOT §10.7).</li>
 *   <li><strong>high</strong> — plus typing the target's name, so a reflexive Enter on an
 *       unattended laptop cannot delete an account.</li>
 * </ul>
 *
 * <p>The gate logic — what makes the confirm button live — is {@link confirmGate}, which is pure
 * and unit-tested. This is the shell that collects input and renders errors.
 *
 * <h2>What this does not do: re-authentication</h2>
 *
 * SSOT §10.7's high tier also demands a fresh password or TOTP — the "sudo window". That is
 * enforced <strong>server-side</strong> by the sudo interceptor (ADM-025), not here: a re-auth
 * prompt the client could skip is theatre. The caller's request carries the sudo credential;
 * this dialog gates only reason and typed confirmation.
 *
 * <h2>Cancel holds focus on open</h2>
 *
 * Radix `AlertDialog` moves initial focus to its Cancel action (AC#2), and nothing here takes it
 * back — no field is auto-focused. Opening the box and pressing Enter cancels; confirming is
 * always a deliberate reach.
 */
export function ConfirmDialog({ open, onOpenChange, ...body }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {/*
          The fields live in this child, which Radix mounts only while the dialog is open. So
          each open is a fresh mount with empty fields — a reason typed for one target never
          bleeds into the next — without a reset effect. Keying by mount is React's answer to
          "reset state when this opens".
        */}
        <ConfirmDialogBody {...body} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmDialogBody({
  tier = "low",
  title,
  description,
  confirmLabel = "Confirm",
  confirmTarget,
  confirmTargetLabel = "value",
  destructive,
  pending = false,
  onConfirm,
}: Omit<ConfirmDialogProps, "open" | "onOpenChange">) {
  const [reason, setReason] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const reasonId = useId();
  const confirmId = useId();

  const gate = confirmGate({
    tier,
    reason,
    confirmationInput,
    confirmationTarget: confirmTarget ?? "",
  });

  // A field's error is only worth showing once the operator has typed something — flagging an
  // empty box the instant it appears is nagging, not help.
  const showReasonError = gate.reasonError !== null && reason.length > 0;
  const showConfirmationError = gate.confirmationError !== null && confirmationInput.length > 0;

  const isDestructive = destructive ?? tier !== "low";

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
      </AlertDialogHeader>

      {gate.reasonRequired ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={reasonId}>Reason</Label>
          <Textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={showReasonError}
            aria-describedby={showReasonError ? `${reasonId}-error` : undefined}
            placeholder="Recorded in the audit log."
          />
          {showReasonError ? (
            <p id={`${reasonId}-error`} role="alert" className="text-sm text-destructive">
              {gate.reasonError}
            </p>
          ) : null}
        </div>
      ) : null}

      {gate.confirmationRequired ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={confirmId}>
            Type the {confirmTargetLabel}{" "}
            <span className="font-mono font-medium text-foreground">{confirmTarget}</span> to
            confirm
          </Label>
          <Input
            id={confirmId}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            autoComplete="off"
            aria-invalid={showConfirmationError}
            aria-describedby={showConfirmationError ? `${confirmId}-error` : undefined}
          />
          {showConfirmationError ? (
            <p id={`${confirmId}-error`} role="alert" className="text-sm text-destructive">
              {gate.confirmationError}
            </p>
          ) : null}
        </div>
      ) : null}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        {/*
          A plain Button, not AlertDialogAction, on purpose: AlertDialogAction closes the dialog
          on click, but the action may be async and may fail. The caller closes the dialog when
          its request succeeds, so a failure leaves the box open with the reason intact rather
          than dismissing it and losing the operator's typing.
        */}
        <Button
          type="button"
          variant={isDestructive ? "destructive" : "default"}
          disabled={!gate.canConfirm || pending}
          onClick={() => onConfirm(reason.trim())}
        >
          {pending ? "Working…" : confirmLabel}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
