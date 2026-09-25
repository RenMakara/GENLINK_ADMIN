"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { endSession, refreshSession, requestChallenge, verifyMfa } from "@/features/auth/auth-client";
import { clearSudoWindow } from "@/features/auth/sudo";
import { api } from "@/lib/api/client";
import { configureAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

/**
 * Session state for the whole portal (SSOT §10.9, ADM-035).
 *
 * <h2>The access token lives in a ref, not in state</h2>
 *
 * Deliberately not `localStorage`, not `sessionStorage`, not a cookie the page can read. Any
 * XSS in an admin panel would otherwise hand over a token carrying `user:delete`. This differs
 * from the mobile client on purpose: browsers have XSS, Flutter does not.
 *
 * <p>A ref rather than `useState` because {@link configureAuth} hands the API client a
 * `getAccessToken` callback that must return the *current* token whenever a request is made.
 * A state value captured in a closure goes stale the moment a refresh replaces it, and the
 * symptom would be a request retrying with the token that had just expired.
 *
 * <h2>Reload restores the session, the access token does not survive it</h2>
 *
 * That is the design working, not a gap. The refresh cookie is `httpOnly`, so a reload sends it
 * automatically and {@link bootstrap} exchanges it for a fresh access token before anything
 * renders.
 */

export interface AdminSession {
  adminUserId: string;
  email: string;
  fullName: string | null;
  roleCode: string;
  roleName: string;
  permissions: string[];
  lastLoginAt: string | null;
  totpEnabled: boolean;
  totpConfirmedAt: string | null;
}

type Status = "loading" | "authenticated" | "unauthenticated";

/**
 * The half-finished sign-in between the password step and the code step.
 *
 * <p>Held in memory only. Not the URL — a token in a query string reaches the browser history,
 * the server access log and any Referer header. Not storage — the lint rule that keeps tokens
 * out of `localStorage` applies just as much to a challenge, and a reload legitimately
 * abandoning a half-finished sign-in is the correct behaviour rather than a limitation.
 */
export interface PendingChallenge {
  token: string;
  enrolmentRequired: boolean;
}

export interface StepResult {
  ok: boolean;
  errorCode?: string;
  status?: number;
}

interface AuthContextValue {
  status: Status;
  session: AdminSession | null;
  /** Permission codes, or null while unknown — see the sidebar's use of it. */
  permissions: string[] | null;
  challenge: PendingChallenge | null;
  /** Password step. On success the caller navigates to the code step. */
  beginSignIn: (email: string, password: string) => Promise<StepResult & { enrolmentRequired?: boolean }>;
  /** Second factor. Uses the challenge held above, so no token crosses a page boundary. */
  completeSignIn: (code: string) => Promise<StepResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [challenge, setChallenge] = useState<PendingChallenge | null>(null);
  const router = useRouter();

  const clear = useCallback(() => {
    accessToken.current = null;
    clearSudoWindow();
    setSession(null);
    setChallenge(null);
    setStatus("unauthenticated");
  }, []);

  const loadSession = useCallback(async () => {
    const me = await api.get<AdminSession>(endpoints.auth.me);
    setSession(me);
    setStatus("authenticated");
  }, []);

  /**
   * Exchanges the refresh cookie for an access token.
   *
   * <p>Returned to the API client through {@link configureAuth}, so an expired token during
   * normal use is replaced transparently — the request that hit the 401 retries and the admin
   * sees nothing. The client single-flights this, so a dashboard firing twelve queries produces
   * one refresh rather than twelve.
   */
  const refresh = useCallback(async (): Promise<boolean> => {
    const result = await refreshSession();
    if (!result.success || !result.data) {
      return false;
    }
    // Admin refresh issues a new access-token session id. A sudo window is scoped to the old
    // token's session id on the server, so client-side knowledge must not survive the rotation.
    clearSudoWindow();
    accessToken.current = result.data.accessToken;
    return true;
  }, []);

  /**
   * Hands the API client its accessor before anything can use it.
   *
   * <p>Declared above the bootstrap effect so it runs first — effects fire in declaration order
   * within a component. Child effects run before a parent's, which would normally be a problem
   * here, but no child can issue a request first: {@link AuthGuard} renders a loading state
   * until `status === "authenticated"`, and that status is only reachable *through* the
   * bootstrap below. Nothing that queries exists until this has run.
   */
  useEffect(() => {
    configureAuth({
      getAccessToken: () => accessToken.current,
      refresh,
      onSessionExpired: () => clear(),
    });
  }, [refresh, clear]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const restored = await refresh();
      if (cancelled) return;
      if (!restored) {
        clear();
        return;
      }
      try {
        await loadSession();
      } catch {
        // A valid refresh token whose admin profile has since been revoked. Treat as signed
        // out rather than leaving a half-authenticated shell on screen.
        if (!cancelled) clear();
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refresh, clear, loadSession]);

  const beginSignIn = useCallback(async (email: string, password: string) => {
    const result = await requestChallenge(email, password);
    if (!result.ok || !result.challengeToken) {
      return { ok: false, errorCode: result.errorCode, status: result.status };
    }
    setChallenge({
      token: result.challengeToken,
      enrolmentRequired: result.enrolmentRequired ?? false,
    });
    return { ok: true, enrolmentRequired: result.enrolmentRequired ?? false };
  }, []);

  const completeSignIn = useCallback(
    async (code: string) => {
      if (!challenge) {
        // Reloading the code page drops the challenge, which is intended. Reported as a
        // distinct code so the page sends them back to the start rather than saying the code
        // was wrong.
        return { ok: false, errorCode: "CHALLENGE_MISSING" };
      }
      const result = await verifyMfa(challenge.token, code);
      if (!result.success || !result.data) {
        return { ok: false, errorCode: result.errorCode };
      }
      clearSudoWindow();
      accessToken.current = result.data.accessToken;
      setChallenge(null);
      await loadSession();
      return { ok: true };
    },
    [challenge, loadSession],
  );

  const signOut = useCallback(async () => {
    await endSession(accessToken.current);
    clear();
    router.replace("/login");
  }, [clear, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      permissions: session?.permissions ?? null,
      challenge,
      beginSignIn,
      completeSignIn,
      signOut,
    }),
    [status, session, challenge, beginSignIn, completeSignIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    // A hard failure rather than a null session: a component that silently believes nobody is
    // signed in would render an empty sidebar and look like a permissions bug.
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
