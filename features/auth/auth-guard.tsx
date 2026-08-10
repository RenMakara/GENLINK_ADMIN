"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-provider";
import { LOGIN_ROUTE, loginUrlFor } from "@/lib/auth/routes";

/**
 * Keeps unauthenticated visitors out of the dashboard (SSOT §10.9, ADM-035, ADM-039).
 *
 * <p>A client guard, which is a convenience rather than a security control — every admin
 * endpoint enforces its own authentication and permissions, and a determined visitor can render
 * whatever they like locally. What this prevents is the ordinary case: an admin whose session
 * expired overnight opening a bookmark and seeing an empty shell full of failed requests.
 *
 * <p>`proxy.ts` handles the same case one step earlier, before React boots, but only where a
 * refresh cookie is absent outright. This is the half that catches a cookie which exists and no
 * longer works — the mid-session expiry in AC#3 — because only an actual refresh attempt can
 * tell the difference.
 *
 * <p>Renders nothing while the session is being restored. Showing the shell first and removing
 * it a moment later reads as a flash of content the visitor was not supposed to see, even though
 * it holds no data.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * An admin holding a valid session whose authenticator has been taken away (AC#2).
   *
   * <p>Not reachable by signing in: the backend issues an `ADMIN` token only after a TOTP code
   * is verified. It happens when a super admin resets someone's TOTP while they are working —
   * `/admin/auth/me` starts reporting `totpEnabled: false` on the next refresh, and the session
   * is no longer one an unenrolled admin is entitled to.
   */
  const enrolmentIncomplete = status === "authenticated" && session !== null && !session.totpEnabled;

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (enrolmentIncomplete) {
      /*
       * To sign-in, not to `/enrol` — despite that being the obvious destination.
       *
       * The enrolment endpoints accept *only* an `ADMIN_MFA_CHALLENGE` bearer token
       * (`AdminMfaEnrolmentService.resolveFromChallenge`), and this admin holds a full `ADMIN`
       * token instead. `/enrol` would therefore render and bounce straight back to sign-in
       * anyway (`enrol-flow.tsx`), so this goes there directly: one hop instead of two, with no
       * flash of an enrolment card that could not have worked.
       *
       * Sign-in *is* the route to enrolment. The password step reports `enrolmentRequired` and
       * sends them to `/enrol` holding the challenge that the endpoints actually accept.
       */
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
