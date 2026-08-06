"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { createQueryClient } from "@/services/query-client";

/**
 * TanStack Query for the whole app.
 *
 * <p>The client is created inside `useState` rather than at module scope. A module-level
 * client is created once per *server process*, so during SSR every visitor would share one
 * cache — one admin's user list served to another. This gives each render its own.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
