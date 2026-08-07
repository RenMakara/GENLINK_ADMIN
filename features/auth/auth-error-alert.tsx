import { AlertTriangle, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authErrorMessage } from "@/features/auth/error-messages";

/**
 * The failure banner for both sign-in steps.
 *
 * <p>`role="alert"` so it is announced the moment it appears — an admin using a screen reader
 * would otherwise submit, hear nothing, and have no idea the form had answered (AC#5).
 */
export function AuthErrorAlert({ errorCode }: { errorCode: string | undefined | null }) {
  if (errorCode === undefined || errorCode === null) {
    return null;
  }
  const message = authErrorMessage(errorCode);
  const Icon = message.tone === "warning" ? AlertTriangle : XCircle;

  return (
    <Alert
      role="alert"
      variant={message.tone === "error" ? "destructive" : "default"}
      className={message.tone === "warning" ? "border-warning/50 text-warning-foreground" : undefined}
    >
      <Icon className="size-4" aria-hidden />
      <AlertTitle>{message.title}</AlertTitle>
      {message.detail ? <AlertDescription>{message.detail}</AlertDescription> : null}
    </Alert>
  );
}
