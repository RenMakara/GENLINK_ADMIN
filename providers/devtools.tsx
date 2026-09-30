"use client";

import dynamic from "next/dynamic";

import { isDevelopment } from "@/lib/config/env";

/** Loads React Query devtools only in development. */
const ReactQueryDevtools = isDevelopment
  ? dynamic(
      () => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
      { ssr: false },
    )
  : null;

export function Devtools() {
  if (!ReactQueryDevtools) return null;
  return <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />;
}
