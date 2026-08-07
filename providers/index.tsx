"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-provider";

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
        <AuthProvider>{children}</AuthProvider>
        <ToastProvider />
        <Devtools />
      </QueryProvider>
    </ThemeProvider>
  );
}
