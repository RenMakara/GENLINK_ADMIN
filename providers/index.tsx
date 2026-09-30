"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-provider";

import { Devtools } from "./devtools";
import { MockingProvider } from "./mocking-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

/** App-wide theme, query, mock, and auth providers in dependency order. */
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
