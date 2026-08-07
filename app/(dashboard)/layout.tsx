import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

/**
 * Route group for every signed-in page. The parentheses keep it out of the URL, so these render
 * at `/dashboard`, `/users` and so on rather than `/dashboard/users`.
 *
 * <p>The auth guard belongs here and is ADM-035; today the shell renders for anyone.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
