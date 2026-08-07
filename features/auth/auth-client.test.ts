import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: { NEXT_PUBLIC_BASE_PATH: "/admin", NEXT_PUBLIC_API_BASE_URL: "/api/v1" },
}));

const { refreshSession, resetRefreshInFlight, resetCsrfToken } = await import("./auth-client");

describe("refreshSession is single-flighted", () => {
  let refreshCalls: number;

  beforeEach(() => {
    refreshCalls = 0;
    resetRefreshInFlight();
    resetCsrfToken();
    vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/csrf")) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { token: "t", header: "x-csrf-token" } })),
        );
      }
      if (url.endsWith("/refresh")) {
        refreshCalls++;
        // Deliberately slow, so concurrent callers overlap the way they do on a real page load.
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(
                  JSON.stringify({ success: true, data: { accessToken: "a", expiresInSeconds: 600 } }),
                ),
              ),
            20,
          ),
        );
      }
      void init;
      return Promise.resolve(new Response("{}"));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * The bug this pins: React StrictMode double-invokes the bootstrap effect, so two refreshes
   * fired with the same cookie. The backend rotates on every refresh, so the second presented a
   * revoked token — treated as theft, revoking every token on the account. A browser reload
   * ended the session and wrote an attack-shaped row into the audit log.
   */
  it("two simultaneous callers produce ONE request", async () => {
    const [a, b] = await Promise.all([refreshSession(), refreshSession()]);

    expect(refreshCalls).toBe(1);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });

  it("a dozen concurrent callers still produce one", async () => {
    await Promise.all(Array.from({ length: 12 }, () => refreshSession()));

    expect(refreshCalls).toBe(1);
  });

  /** Every caller must receive the result, not just the one that started it. */
  it("all callers share the same answer", async () => {
    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(results.every((r) => r.success)).toBe(true);
  });

  /**
   * The guard must not become permanent. Holding the resolved promise would make a genuinely
   * later expiry reuse a stale answer and never refresh again.
   */
  it("a later refresh starts a new request", async () => {
    await refreshSession();
    expect(refreshCalls).toBe(1);

    await refreshSession();
    expect(refreshCalls).toBe(2);
  });

  /**
   * The CSRF fetch races the same way. Before this, two callers each fetched a token, the
   * endpoint minted a fresh one for each, and whichever finished first held a token the cookie
   * no longer matched — 403, cache cleared, refetch, loop.
   */
  it("concurrent callers share ONE csrf fetch", async () => {
    let csrfCalls = 0;
    vi.stubGlobal("fetch", (input: string) => {
      const url = String(input);
      if (url.endsWith("/csrf")) {
        csrfCalls++;
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ data: { token: "t", header: "x-csrf-token" } })),
              ),
            20,
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: { accessToken: "a", expiresInSeconds: 600 } })),
      );
    });

    await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(csrfCalls).toBe(1);
  });

  it("clears after a failure too, so a retry is possible", async () => {
    vi.stubGlobal("fetch", (input: string) => {
      const url = String(input);
      if (url.endsWith("/csrf")) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { token: "t", header: "x-csrf-token" } })),
        );
      }
      refreshCalls++;
      return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 401 }));
    });

    await refreshSession();
    await refreshSession();

    expect(refreshCalls).toBe(2);
  });
});
