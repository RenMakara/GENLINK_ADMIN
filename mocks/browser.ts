/** Development browser worker, loaded only when mocking is enabled. */

import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
