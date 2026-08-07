"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-provider";

/**
 * Keeps unauthenticated visitors out of the dashboard (SSOT §10.9).
 *
 * <p>A client guard, which is a convenience rather than a security control — every admin
 * endpoint enforces its own authentication and permissions, and a determined visitor can render
 * whatever they like locally. What this prevents is the ordinary case: an admin whose session
 * expired overnight opening a bookmark and seeing an empty shell full of failed requests.
 *
 * <p>Renders nothing while the session is being restored. Showing the shell first and removing
 * it a moment later reads as a flash of content the visitor was not supposed to see, even
 * though it holds no data.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
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
