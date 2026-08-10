/**
 * The browser Service Worker, for development.
 *
 * <p>Imports `msw/browser` — browser-only. Kept apart from `server.ts` (Node) so neither
 * platform's entrypoint drags in the other's. Only ever imported dynamically, from `start.ts`,
 * and only when mocking is enabled, so it is code-split out of a production bundle entirely.
 */

import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
