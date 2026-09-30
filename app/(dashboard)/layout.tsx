import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/features/auth/auth-guard";

/** Shared shell and auth guard for signed-in routes. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
