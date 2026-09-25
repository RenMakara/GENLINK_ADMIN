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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import {
  clearSudoWindow,
  openSudoWindow,
  type SudoCredentials,
} from "@/features/auth/sudo";
import { confirmGate, type ConfirmTier } from "@/lib/ui/confirm";

export type { SudoCredentials } from "@/features/auth/sudo";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: ConfirmTier;
  title: ReactNode;
  description?: ReactNode;
  /**
   * The exact consequence of confirming this action. It is rendered in the dialog's inline
   * alert so an operator cannot confirm based on a vague title alone.
   */
  consequence: ReactNode;
  confirmLabel?: string;
  /** High tier only: the exact string the operator must type (username or email). */
  confirmTarget?: string;
  /** What that string is, for the prompt — "email", "username". */
  confirmTargetLabel?: string;
  /** Draw the confirm button as destructive. Defaults on for medium and high tiers. */
  destructive?: boolean;
  /** The action is in flight — disables the button and shows a working label. */
  pending?: boolean;
  /** Additional feature-specific validation can disable confirmation while keeping the form open. */
  confirmDisabled?: boolean;
  /** Optional action-specific form content rendered before the reason field. */
  children?: ReactNode;
  /** Optional scroll treatment for confirmations with a larger feature-owned form. */
  contentClassName?: string;
  /** Maps a typed API error to safe, user-facing copy; raw server details are never rendered. */
  errorMessageFor?: (error: unknown) => string | null;
  /** Called with the trimmed reason ("" for low tier). The dialog closes after success. */
  onConfirm: (reason: string) => void | Promise<void>;
  /**
   * Opens the server-side five-minute sudo window. When an action rejects with
   * ADMIN_SUDO_REQUIRED, the dialog keeps its reason and target fields, renders the inline
   * re-auth prompt, and calls this function before retrying the original action. Defaults to the
   * shared ADM-089 window service.
   */
  onSudoReauthenticate?: (credentials: SudoCredentials) => Promise<unknown>;
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
 * <h2>Sudo-required actions resume in place</h2>
 *
 * A high-tier request can be refused with {@code ADMIN_SUDO_REQUIRED}. When the caller supplies
 * {@link onSudoReauthenticate}, the dialog keeps the operator's reason and target confirmation,
 * asks for a password or fresh TOTP code inline, opens the server-side five-minute window, and
 * retries the original action. The server remains authoritative; the component never treats a
 * client-side flag as proof of re-authentication.
 *
 * <h2>Cancel holds focus on open</h2>
 *
 * Radix `AlertDialog` moves initial focus to its Cancel action (AC#2), and nothing here takes it
 * back — no field is auto-focused. Opening the box and pressing Enter cancels; confirming is
 * always a deliberate reach.
 */
export function ConfirmDialog({ open, onOpenChange, contentClassName, ...body }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={contentClassName}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement)
            .querySelector<HTMLButtonElement>("[data-confirm-cancel]")
            ?.focus();
        }}
      >
        {/*
          The fields live in this child, which Radix mounts only while the dialog is open. So
          each open is a fresh mount with empty fields — a reason typed for one target never
          bleeds into the next — without a reset effect. Keying by mount is React's answer to
          "reset state when this opens".
        */}
        <ConfirmDialogBody {...body} onOpenChange={onOpenChange} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmDialogBody({
  tier = "low",
  title,
  description,
  consequence,
  confirmLabel = "Confirm",
  confirmTarget,
  confirmTargetLabel = "value",
  destructive,
  pending = false,
  confirmDisabled = false,
  children,
  errorMessageFor,
  onConfirm,
  onSudoReauthenticate,
  onOpenChange,
}: Omit<ConfirmDialogProps, "open">) {
  const [reason, setReason] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sudoRequired, setSudoRequired] = useState(false);
  const [sudoCode, setSudoCode] = useState("");
  const [sudoPassword, setSudoPassword] = useState("");
  const [sudoPending, setSudoPending] = useState(false);
  const [sudoError, setSudoError] = useState<string | null>(null);
  const reasonId = useId();
  const confirmId = useId();
  const sudoCodeId = useId();
  const sudoPasswordId = useId();

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
  const busy = pending || actionPending || sudoPending;

  /**
   * Keep this separate from the click handler so the same action can be retried after sudo
   * without re-reading or resetting any of the dialog fields.
   */
  const executeAction = async () => {
    setActionError(null);
    setActionPending(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.needsSudo) {
        // The server is authoritative. If the client thought the window was open, it is stale
        // for this session/token and must not make the next retry loop on the same cache entry.
        clearSudoWindow();
        setSudoRequired(true);
        setSudoError(null);
      } else {
        // Do not surface raw server messages or exception details to staff.
        setActionError(
          errorMessageFor?.(error) ?? "This action could not be completed. Nothing was changed.",
        );
      }
    } finally {
      setActionPending(false);
    }
  };

  const handleConfirm = () => {
    if (!gate.canConfirm || confirmDisabled || busy) return;
    void executeAction();
  };

  const handleSudoSubmit = async () => {
    if (busy) return;

    const code = sudoCode.trim();
    const password = sudoPassword;
    if (!code && !password) {
      setSudoError("Enter your password or a current 6-digit authenticator code.");
      return;
    }
    if (code && !/^\d{6}$/.test(code)) {
      setSudoError("The authenticator code must be exactly 6 digits.");
      return;
    }
    setSudoError(null);
    setSudoPending(true);
    try {
      const reauthenticate = onSudoReauthenticate ?? openSudoWindow;
      await reauthenticate({
        ...(code ? { code } : {}),
        ...(password ? { password } : {}),
      });
      setSudoRequired(false);
      setSudoCode("");
      setSudoPassword("");
      await executeAction();
    } catch (error) {
      // A failed sudo attempt must leave the original form intact and must not retry the action.
      if (error instanceof ApiError && error.needsSudo) {
        setSudoError("That verification was not accepted. Enter a fresh code or try again.");
      } else {
        setSudoError("That verification was not accepted. Check the value and try again.");
      }
    } finally {
      setSudoPending(false);
    }
  };

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
      </AlertDialogHeader>

      <Alert variant={isDestructive ? "destructive" : "default"}>
        <AlertTitle>What will happen</AlertTitle>
        <AlertDescription>{consequence}</AlertDescription>
      </Alert>

      {children ? <div className="flex flex-col gap-3">{children}</div> : null}

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

      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Action not completed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {sudoRequired ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <Alert variant="destructive">
            <AlertTitle>Additional verification required</AlertTitle>
            <AlertDescription>
              Confirm your identity to open the five-minute security window, then this action will
              be retried with the details you already entered.
            </AlertDescription>
          </Alert>

          <fieldset className="flex flex-col gap-3" disabled={busy}>
            <legend className="text-sm font-medium text-foreground">Re-authenticate</legend>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={sudoCodeId}>Authenticator code</Label>
              <Input
                id={sudoCodeId}
                value={sudoCode}
                onChange={(event) => {
                  setSudoCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  if (event.target.value) setSudoPassword("");
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6 digits"
                aria-invalid={Boolean(sudoError)}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">or</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={sudoPasswordId}>Account password</Label>
              <Input
                id={sudoPasswordId}
                type="password"
                value={sudoPassword}
                onChange={(event) => {
                  setSudoPassword(event.target.value);
                  if (event.target.value) setSudoCode("");
                }}
                autoComplete="current-password"
                aria-invalid={Boolean(sudoError)}
              />
            </div>
          </fieldset>

          {sudoError ? (
            <p role="alert" className="text-sm text-destructive">
              {sudoError}
            </p>
          ) : null}

          <Button type="button" onClick={() => void handleSudoSubmit()} disabled={busy}>
            {sudoPending ? "Verifying…" : "Verify and continue"}
          </Button>
        </div>
      ) : null}

      <AlertDialogFooter>
        <AlertDialogCancel data-confirm-cancel disabled={busy}>Cancel</AlertDialogCancel>
        {/*
          A plain Button, not AlertDialogAction, on purpose: AlertDialogAction closes the dialog
          before the async action can report ADMIN_SUDO_REQUIRED or another failure. This button
          leaves the form open, and the dialog closes only after the action succeeds.
        */}
        <Button
          type="button"
          variant={isDestructive ? "destructive" : "default"}
          disabled={!gate.canConfirm || confirmDisabled || busy}
          onClick={handleConfirm}
        >
          {actionPending ? "Working…" : confirmLabel}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
