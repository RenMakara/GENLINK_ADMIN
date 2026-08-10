"use client";

import { useEffect, useState, type ReactNode } from "react";

import { isMockingEnabled } from "@/mocks/start";

/**
 * Starts the MSW worker before the app issues its first request, when mocking is enabled.
 *
 * <p>Only the flag is imported statically — `isMockingEnabled` is the inlined env boolean and
 * pulls in no `msw` code. The worker itself is loaded through the dynamic `import()` inside
 * `startMocking`, so a production build (where the flag is off) never includes it.
 *
 * <p>When enabled, the app subtree is held back until `worker.start()` resolves. Otherwise the
 * {@link AuthProvider}'s bootstrap would fire `/auth/me` before the Service Worker was ready to
 * intercept it, and that first request would slip through to the network. When disabled there is
 * nothing to wait for, so children render on the first pass unchanged.
 */
export function MockingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isMockingEnabled);

  useEffect(() => {
    if (!isMockingEnabled) return;
    let active = true;
    void import("@/mocks/start")
      .then(({ startMocking }) => startMocking())
      .then(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
