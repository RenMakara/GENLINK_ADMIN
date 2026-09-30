/** Node MSW server for tests; interception is enabled per test file. */

import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
