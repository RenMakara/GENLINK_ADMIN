import { AlertTriangle, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authErrorMessage } from "@/features/auth/error-messages";

/** Accessible failure banner used on both sign-in steps. */
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
