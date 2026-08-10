"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-provider";

import { Devtools } from "./devtools";
import { MockingProvider } from "./mocking-provider";
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
 *   <li>{@link MockingProvider} wraps the app subtree (ADM-041): when mocking is enabled it holds
 *       rendering until the MSW worker is intercepting, so the auth bootstrap below does not race
 *       it. A no-op wrapper when disabled — which is always, in production.
 *   <li>{@link AuthProvider} innermost (ADM-035): it fetches `/admin/auth/me`, so it needs the
 *       query client above it, and everything that gates on a session needs to sit inside it.
 * </ul>
 *
 * <p>`NextIntlClientProvider` stays in `layout.tsx` because the locale is resolved on the
 * server.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <MockingProvider>
          <AuthProvider>{children}</AuthProvider>
        </MockingProvider>
        <ToastProvider />
        <Devtools />
      </QueryProvider>
    </ThemeProvider>
  );
}
