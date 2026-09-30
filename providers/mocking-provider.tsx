"use client";

import { useEffect, useState, type ReactNode } from "react";

import { isMockingEnabled } from "@/mocks/start";

/** Starts MSW before rendering when API mocking is enabled. */
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
