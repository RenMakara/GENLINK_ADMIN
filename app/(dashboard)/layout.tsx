import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/features/auth/auth-guard";

/**
 * Route group for every signed-in page. The parentheses keep it out of the URL, so these render
 * at `/dashboard`, `/users` and so on rather than `/dashboard/users`.
 *
 * <p>{@link AuthGuard} sits outside the shell so an unauthenticated visitor never sees the
 * chrome at all, not even briefly.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
