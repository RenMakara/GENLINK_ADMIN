"use client";

import dynamic from "next/dynamic";

import { isDevelopment } from "@/lib/config/env";

/**
 * React Query devtools, development only.
 *
 * <p>The `dynamic()` call sits inside the `isDevelopment` branch, not merely the render. That
 * distinction is the whole point, and it was measured rather than assumed: guarding only the
 * render still leaves the import registered at module scope, and the production build then
 * carried a **369 KB** devtools chunk. Moving the `dynamic()` call behind the build-time
 * literal reduced that to a **290-byte** no-op stub.
 *
 * <p>It also matters that `@tanstack/react-query-devtools` is a devDependency: a deployment
 * installed with `--prod` would not have the package at all, and a production bundle that
 * still referenced it would fail to build.
 */
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
