/**
 * Starts the browser mock worker, when — and only when — mocking is enabled.
 *
 * <p>The single toggle (SSOT §8 / ADM-041 AC-1) is `NEXT_PUBLIC_API_MOCKING`, read through the
 * one env boundary (SSOT §1.7). Disabled by default and in production, so a production bundle
 * never starts a worker; and because `./browser` is reached through a dynamic `import()` behind
 * that guard, `msw/browser` is code-split into a chunk that is never fetched when mocking is
 * off — the production build stays clean.
 */

import { env } from "@/lib/config/env";

export const isMockingEnabled = env.NEXT_PUBLIC_API_MOCKING;

let startPromise: Promise<void> | null = null;

export async function startMocking(): Promise<void> {
  // A no-op unless explicitly enabled, and never on the server — the worker is a browser API.
  if (!isMockingEnabled || typeof window === "undefined") return;

  if (!startPromise) {
    startPromise = (async () => {
      const { worker } = await import("./browser");

      await worker.start({
        // Anything without a matching handler goes to the network untouched — Next's own assets,
        // HMR, and the `/admin/api/auth/**` route handlers must not be intercepted (AC: no
        // accidental interception of unrelated requests).
        onUnhandledRequest: "bypass",
        serviceWorker: {
          // `public/` is served under the portal's base path, so the worker script lives at
          // `${basePath}/mockServiceWorker.js`.
          url: `${env.NEXT_PUBLIC_BASE_PATH}/mockServiceWorker.js`,
          // The admin UI is under `/admin` but the API is at `/api/v1` — a different root. A worker
          // scoped to `/admin/` could not see the API calls, so it is registered at root scope.
          // That widening requires the `Service-Worker-Allowed: /` header the dev config attaches
          // to the worker response.
          options: { scope: "/" },
        },
      });
    })().catch((err) => {
      startPromise = null;
      throw err;
    });
  }

  return startPromise;
}
