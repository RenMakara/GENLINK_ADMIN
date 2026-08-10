/**
 * The Node request-interception server, for Vitest.
 *
 * <p>Imports `msw/node` — Node-only. Kept in its own module so a browser bundle never reaches
 * it and a Node test never has to touch `msw/browser`. Tests own the lifecycle explicitly
 * (`listen` / `resetHandlers` / `close`) rather than a global setup file starting it for the
 * whole suite: the existing `lib/api/client.test.ts` stubs `fetch` directly, and a
 * suite-wide interceptor would fight that. Interception is opt-in, per test file.
 */

import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
