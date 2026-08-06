"use client";

import type { ReactNode } from "react";

import { Devtools } from "./devtools";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

/**
 * Every app-wide provider, composed once.
 *
 * <p>One component so the root layout mounts a single thing and the nesting order lives in
 * one readable place instead of accumulating in `layout.tsx`.
 *
 * <p>Order matters:
 * <ul>
 *   <li>{@link ThemeProvider} outermost — {@link ToastProvider} reads the resolved theme, so
 *       it has to be inside.
 *   <li>{@link QueryProvider} next, so anything below can call `useQuery`.
 * </ul>
 *
 * <p><strong>AuthProvider slots in below QueryProvider</strong> when ADM-035 lands: it needs
 * the query client to fetch `/admin/auth/me`, and everything that gates on a session needs to
 * sit inside it. `NextIntlClientProvider` stays in `layout.tsx` because the locale is resolved
 * on the server.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <ToastProvider />
        <Devtools />
      </QueryProvider>
    </ThemeProvider>
  );
}
