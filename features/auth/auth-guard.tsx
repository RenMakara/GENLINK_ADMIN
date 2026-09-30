"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-provider";
import { LOGIN_ROUTE, loginUrlFor } from "@/lib/auth/routes";

/** Restores sessions before protected content renders; APIs enforce access. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /** Handles sessions whose authenticator was reset by another admin. */
  const enrolmentIncomplete = status === "authenticated" && session !== null && !session.totpEnabled;

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (enrolmentIncomplete) {
      /* Send reset sessions to sign-in; enrolment requires an MFA challenge token. */
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (status === "unauthenticated") {
      // `window.location.search` rather than `useSearchParams()`: this guard wraps every
      // dashboard page, and that hook would pull each one's entire client tree out of
      // prerendering up to the nearest Suspense boundary. Read inside the effect, so it never
      // runs on the server.
      router.replace(loginUrlFor(pathname, window.location.search));
    }
  }, [status, enrolmentIncomplete, pathname, router]);

  if (status !== "authenticated" || enrolmentIncomplete) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="text-muted-foreground flex min-h-svh items-center justify-center text-sm"
      >
        {status === "loading" ? "Restoring your session…" : "Redirecting to sign in…"}
      </div>
    );
  }

  return <>{children}</>;
}
