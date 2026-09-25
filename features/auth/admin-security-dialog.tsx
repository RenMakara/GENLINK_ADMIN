"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/date";
import { useRegenerateRecoveryCodes } from "@/services/auth";

import { RecoveryCodes } from "./recovery-codes";
import type { AdminSession } from "./auth-provider";

export interface AdminSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: AdminSession | null;
}

export function recoveryCodesErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "ADMIN_MFA_NOT_ENROLLED":
      return "Two-factor authentication is not enrolled on this account. Sign in again to complete setup.";
    case "UNAUTHORIZED":
      return "Your admin session has expired. Sign in again and retry.";
    case "FORBIDDEN":
      return "The server did not allow recovery-code regeneration for this account.";
    default:
      return error.status === 0
        ? "The authentication service is unavailable. Nothing was changed."
        : "Recovery codes could not be regenerated. Nothing was changed.";
  }
}

/** ADM-112: self-service 2FA status and one-time recovery-code regeneration. */
export function AdminSecurityDialog({
  open,
  onOpenChange,
  session,
}: AdminSecurityDialogProps) {
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const regenerate = useRegenerateRecoveryCodes();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // If the operator dismisses the one-time view, forget the plaintext immediately. The
      // server stores only hashes, so there is no second chance to retrieve these codes.
      setRecoveryCodes(null);
      setConfirmOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleRegenerate = async () => {
    const result = await regenerate.mutateAsync();
    if (!result.recoveryCodes.length) {
      throw new Error("The recovery-code response was empty");
    }
    setRecoveryCodes(result.recoveryCodes);
  };

  const handleAcknowledged = () => {
    setRecoveryCodes(null);
    onOpenChange(false);
  };

  const enrolled = session?.totpEnabled === true;

  return (
    <>
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent
          className="max-w-lg"
          onEscapeKeyDown={(event) => {
            if (recoveryCodes) event.preventDefault();
          }}
        >
          {recoveryCodes ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Save your new recovery codes</AlertDialogTitle>
                <AlertDialogDescription>
                  These codes replace every previous recovery code and are shown only once.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <RecoveryCodes codes={recoveryCodes} onAcknowledged={handleAcknowledged} />
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Security &amp; two-factor authentication</AlertDialogTitle>
                <AlertDialogDescription>
                  Review your authenticator status and manage your single-use recovery codes.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                    <ShieldCheck className="size-5" aria-hidden />
                  </span>
                  <dl className="grid min-w-0 flex-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Two-factor status</dt>
                      <dd className="mt-1">
                        <Badge variant={enrolled ? "default" : "destructive"}>
                          {enrolled ? "Enabled" : "Not enrolled"}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Enrolled on</dt>
                      <dd className="mt-1 font-medium">
                        {enrolled && session?.totpConfirmedAt
                          ? formatDate(session.totpConfirmedAt)
                          : "Not available"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <Alert>
                <AlertTitle>Recovery codes</AlertTitle>
                <AlertDescription>
                  Regenerating codes invalidates the previous set. Fresh codes will be displayed
                  once after sudo verification, and the server never stores them in plaintext.
                </AlertDescription>
              </Alert>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={regenerate.isPending}>Close</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!enrolled || regenerate.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  {regenerate.isPending ? "Regenerating…" : "Regenerate recovery codes"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Regenerate recovery codes?"
        description="This permanently replaces the recovery codes currently on your account."
        consequence="Every previous recovery code will stop working. After sudo verification, ten new single-use codes will be shown once; save them before closing this window."
        confirmLabel="Regenerate codes"
        destructive
        pending={regenerate.isPending}
        errorMessageFor={recoveryCodesErrorMessage}
        onConfirm={handleRegenerate}
      />
    </>
  );
}
