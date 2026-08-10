import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Drives the *real* API client (`lib/api/client`) through the Node MSW server, so the assertion
 * is end-to-end: a mocked response is unwrapped exactly as a real one would be, and a mocked
 * failure produces the same typed {@link ApiError} the UI branches on. Testing the handlers in
 * isolation would prove the fixture shape but not that the client accepts it.
 *
 * <p>The base URL is stubbed to an absolute host before the modules load, because a relative
 * `/api/v1` cannot be parsed by `fetch` under Node — the browser has an origin to resolve it
 * against, Node does not. The handlers match host-agnostically (a wildcard host prefix), so the
 * same handlers still serve the browser worker where the base is relative.
 */

// Bound in beforeAll after the env is stubbed and modules are reloaded.
let api: typeof import("@/lib/api/client").api;
let resetAuth: typeof import("@/lib/api/client").resetAuth;
let ApiError: typeof import("@/lib/api/errors").ApiError;
let endpoints: typeof import("@/lib/api/endpoints").endpoints;
let errorResponses: typeof import("./handlers").errorResponses;
let apiPattern: typeof import("./handlers").apiPattern;
let server: typeof import("./server").server;
let http: typeof import("msw").http;

async function expectApiError(promise: Promise<unknown>): Promise<InstanceType<typeof ApiError>> {
  try {
    await promise;
  } catch (thrown) {
    if (thrown instanceof ApiError) return thrown;
    throw thrown;
  }
  throw new Error("Expected the call to reject with an ApiError, but it resolved.");
}

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost/api/v1");
  vi.resetModules();

  ({ api, resetAuth } = await import("@/lib/api/client"));
  ({ ApiError } = await import("@/lib/api/errors"));
  ({ endpoints } = await import("@/lib/api/endpoints"));
  ({ errorResponses, apiPattern } = await import("./handlers"));
  ({ server } = await import("./server"));
  ({ http } = await import("msw"));

  // `error`, not `bypass`: an unhandled request is a test failure here, which is also what lets
  // the "no accidental interception" case below distinguish a real passthrough from a mock.
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  resetAuth();
});

afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});

describe("auth handlers (through the real client)", () => {
  it("unwraps the mocked /auth/me session", async () => {
    const session = await api.get<{ email: string; permissions: string[] }>(endpoints.auth.me);

    expect(session.email).toBe("admin@genlink.kh");
    expect(session.permissions).toContain("user:read");
  });

  it("returns the mocked session tokens from /mfa/verify", async () => {
    const tokens = await api.post<{ accessToken: string }>(endpoints.auth.verifyMfa, { code: "123456" });
    expect(tokens.accessToken).toBe("mock.access.token");
  });
});

describe("error fixtures fail the way the API fails", () => {
  it("maps a 403 ADMIN_SUDO_REQUIRED to the typed code", async () => {
    server.use(http.post(apiPattern(endpoints.auth.sudo), errorResponses.sudoRequired));

    const error = await expectApiError(api.post(endpoints.auth.sudo));

    expect(error.status).toBe(403);
    expect(error.code).toBe("ADMIN_SUDO_REQUIRED");
    expect(error.needsSudo).toBe(true);
  });

  it("maps a 403 FORBIDDEN to the typed code", async () => {
    server.use(http.get(apiPattern(endpoints.auth.me), errorResponses.forbidden));

    const error = await expectApiError(api.get(endpoints.auth.me));

    expect(error.status).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("maps a 429 RATE_LIMITED to the typed code", async () => {
    server.use(http.post(apiPattern(endpoints.auth.login), errorResponses.rateLimited));

    const error = await expectApiError(api.post(endpoints.auth.login, {}));

    expect(error.status).toBe(429);
    expect(error.code).toBe("RATE_LIMITED");
  });

  it("maps a 400 VALIDATION_ERROR to the typed code", async () => {
    server.use(http.post(apiPattern(endpoints.auth.login), errorResponses.validationError));

    const error = await expectApiError(api.post(endpoints.auth.login, {}));

    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });
});

describe("interception scope", () => {
  it("does not fabricate a response for an endpoint no handler owns", async () => {
    // With onUnhandledRequest: "error" the request is *not* mocked — it falls through and the
    // transport fails, which the client reports as status 0. A 2xx here would mean MSW had
    // silently answered a route we never registered.
    const error = await expectApiError(api.get("/admin/users"));

    expect(error.status).toBe(0);
  });
});
