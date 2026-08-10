import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The single toggle, from both sides (ADM-041 AC-1). The worker itself needs a browser, so what
 * is asserted here is the *decision*: whether mocking is on, and that `startMocking` never
 * reaches for `msw/browser` when it should not — off by default, and even when on there is no
 * `window` on the server to host a worker.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("mock toggle", () => {
  it("is disabled by default", async () => {
    vi.resetModules();
    const { isMockingEnabled, startMocking } = await import("./start");

    expect(isMockingEnabled).toBe(false);
    // Returns without importing the browser worker; nothing to await it into.
    await expect(startMocking()).resolves.toBeUndefined();
  });

  it("reads the flag when set, and still no-ops on the server (no window)", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "true");
    vi.resetModules();
    const { isMockingEnabled, startMocking } = await import("./start");

    expect(isMockingEnabled).toBe(true);
    // Node has no `window`, so it returns before the dynamic `import("./browser")` — proving the
    // guard that keeps browser-only code off the server.
    await expect(startMocking()).resolves.toBeUndefined();
  });
});
