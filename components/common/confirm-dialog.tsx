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
  /** Exact consequence shown in the confirmation alert. */
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
  /** Reauthenticates and retries sudo-required actions without losing entered details. */
  onSudoReauthenticate?: (credentials: SudoCredentials) => Promise<unknown>;
}

/** Confirms sensitive actions with tiered input and optional inline sudo reauthentication. */
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
        {/* Radix remounts this child on open, so each confirmation starts with empty fields. */}
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

  /** Retry after sudo without resetting the dialog fields. */
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
        {/* Keep the dialog open when an async action fails. */}
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
