/** Maps stable API error codes to safe, actionable sign-in messages. */

export interface AuthErrorMessage {
  title: string;
  detail?: string;
  /** Rate limiting is a wait, not a mistake — the form styles it differently. */
  tone: "error" | "warning";
}

const MESSAGES: Record<string, AuthErrorMessage> = {
  UNAUTHORIZED: {
    title: "Email or password is incorrect",
    detail: "Check both and try again.",
    tone: "error",
  },
  RATE_LIMITED: {
    title: "Too many attempts",
    detail:
      "Sign-in is locked for this account for 15 minutes. Waiting is the only thing that " +
      "clears it — further attempts do not shorten it.",
    tone: "warning",
  },
  ADMIN_MFA_INVALID: {
    title: "That code was not accepted",
    detail:
      "Codes change every 30 seconds, so make sure you are reading the current one. You can " +
      "also use one of your recovery codes.",
    tone: "error",
  },
  ADMIN_MFA_NOT_ENROLLED: {
    // Handled by redirecting, so this is only ever seen if the redirect fails.
    title: "Two-factor authentication is not set up",
    detail: "You need to set up an authenticator app before you can sign in.",
    tone: "warning",
  },
  ADMIN_MFA_ALREADY_ENROLLED: {
    title: "Two-factor authentication is already set up",
    detail: "Enter a code from your authenticator app instead.",
    tone: "warning",
  },
  CHALLENGE_MISSING: {
    title: "This sign-in has expired",
    detail: "Start again from the beginning.",
    tone: "warning",
  },
  CSRF_TOKEN_INVALID: {
    title: "Your page is out of date",
    detail: "Reload and try again.",
    tone: "warning",
  },
  VALIDATION_ERROR: {
    title: "Check the details you entered",
    tone: "error",
  },
};

/** Names unknown codes so support can identify the failure. */
export function authErrorMessage(errorCode: string | undefined): AuthErrorMessage {
  if (!errorCode) {
    return {
      title: "Could not reach the server",
      detail: "Check your connection and try again.",
      tone: "error",
    };
  }
  return (
    MESSAGES[errorCode] ?? {
      title: "Sign-in failed",
      detail: `The server reported ${errorCode}.`,
      tone: "error",
    }
  );
}

/** Codes for which the page navigates instead of showing a message. */
export function redirectsToEnrolment(errorCode: string | undefined): boolean {
  return errorCode === "ADMIN_MFA_NOT_ENROLLED";
}
