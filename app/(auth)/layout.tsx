import type { ReactNode } from "react";

/**
 * The shell-free layout for sign-in (SSOT §12).
 *
 * <p>No sidebar, no topbar: none of it is reachable yet, and rendering navigation to pages that
 * would bounce you back here is worse than a bare page. Route-group parentheses keep `(auth)`
 * out of the URL, so these stay at `/login` and `/mfa`.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      {children}
      <p className="text-muted-foreground text-xs">GenLink KH · Admin</p>
    </div>
  );
}
