import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, configureAuth, request, resetAuth } from "./client";
import { ApiError } from "./errors";
import type { PageResponse } from "./types";

/** Builds a Response carrying the backend's ApiResponse envelope. */
function envelope(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function success<T>(data: T): Response {
  return envelope({ success: true, message: "OK", data, timestamp: "2026-08-06T12:00:00Z" });
}

function failure(status: number, errorCode: string, message = "failed"): Response {
  return envelope({ success: false, message, errorCode, timestamp: "2026-08-06T12:00:00Z" }, status);
}

/**
 * Awaits a call that must fail, and returns the typed error.
 *
 * Better than `.catch((e) => e)`: that yields `unknown`, and — worse — a promise that
 * *resolved* would flow straight into the assertions and quietly pass.
 */
async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (thrown) {
    if (thrown instanceof ApiError) return thrown;
    throw thrown;
  }
  throw new Error("Expected the call to reject with an ApiError, but it resolved.");
}

describe("api client", () => {
  beforeEach(() => {
    resetAuth();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetAuth();
  });

  it("unwraps the envelope and returns data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(success({ id: "u1", name: "Sok Dara" }));

    await expect(api.get("/admin/users/u1")).resolves.toEqual({ id: "u1", name: "Sok Dara" });
  });

  /**
   * AC#1. The UI branches on the code, so a failure has to arrive as something with a `code`
   * field — not a string it would have to parse.
   */
  it("surfaces a 403 as a typed ApiError carrying the errorCode", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(failure(403, "ADMIN_SUDO_REQUIRED", "Step-up required"));

    const error = await expectApiError(api.post("/admin/users/u1/ban", {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("ADMIN_SUDO_REQUIRED");
    expect(error.status).toBe(403);
    expect(error.needsSudo).toBe(true);
    // The server's message is kept for logs, never for display.
    expect(error.serverMessage).toBe("Step-up required");
  });

  it("keeps an unrecognised code reportable instead of pretending to understand it", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(failure(400, "SOME_FUTURE_CODE"));

    const error = await expectApiError(api.get("/admin/users"));

    expect(error.code).toBe("UNKNOWN");
    // Still recoverable from a bug report even though the UI shows a generic message.
    expect(error.rawCode).toBe("SOME_FUTURE_CODE");
  });

  it("reports a transport failure rather than a parse error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const error = await expectApiError(api.get("/admin/users"));

    expect(error.rawCode).toBe("NETWORK");
    expect(error.status).toBe(0);
  });

  it("does not swallow an abort", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    // TanStack Query has to be able to tell a cancelled query from a failed one.
    await expect(api.get("/admin/users")).rejects.toBeInstanceOf(DOMException);
  });

  it("treats a non-JSON body as an HTTP failure", async () => {
    // What an nginx error page or a proxy timeout actually looks like.
    vi.mocked(fetch).mockResolvedValueOnce(new Response("<html>502 Bad Gateway</html>", { status: 502 }));

    const error = await expectApiError(api.get("/admin/users"));

    expect(error.status).toBe(502);
    expect(error.serverMessage).toContain("not JSON");
  });

  describe("session refresh", () => {
    /**
     * AC#2, and the reason the guard exists. The backend rotates the refresh token on every
     * call, so a second concurrent refresh would invalidate the token the first just issued
     * and throw the admin out mid-session.
     */
    it("refreshes once for many concurrent 401s", async () => {
      const refresh = vi.fn().mockResolvedValue(true);
      configureAuth({ getAccessToken: () => "expired", refresh });

      vi.mocked(fetch).mockImplementation(async (input) => {
        const path = String(input);
        if (path.includes("attempt-marker")) return success("retried");
        // Every first attempt is unauthorised; the retry carries a marker.
        return failure(401, "UNAUTHORIZED");
      });

      // Ten queries firing together, exactly as a dashboard does on load.
      await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) => api.get(`/admin/widget-${i}`)),
      );

      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("retries the original request after a successful refresh", async () => {
      const refresh = vi.fn().mockResolvedValue(true);
      configureAuth({ getAccessToken: () => "expired", refresh });

      vi.mocked(fetch)
        .mockResolvedValueOnce(failure(401, "UNAUTHORIZED"))
        .mockResolvedValueOnce(success({ id: "u1" }));

      await expect(api.get("/admin/users/u1")).resolves.toEqual({ id: "u1" });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("signals an expired session when refresh fails, and does not retry", async () => {
      const onSessionExpired = vi.fn();
      configureAuth({
        getAccessToken: () => "expired",
        refresh: async () => false,
        onSessionExpired,
      });

      vi.mocked(fetch).mockResolvedValue(failure(401, "UNAUTHORIZED"));

      await expect(api.get("/admin/users")).rejects.toBeInstanceOf(ApiError);
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("allows a later expiry to refresh again", async () => {
      const refresh = vi.fn().mockResolvedValue(true);
      configureAuth({ getAccessToken: () => "expired", refresh });

      vi.mocked(fetch)
        .mockResolvedValueOnce(failure(401, "UNAUTHORIZED"))
        .mockResolvedValueOnce(success("first"))
        .mockResolvedValueOnce(failure(401, "UNAUTHORIZED"))
        .mockResolvedValueOnce(success("second"));

      await api.get("/admin/a");
      await api.get("/admin/b");

      // The guard must clear after settling, or the session could never be renewed twice.
      expect(refresh).toHaveBeenCalledTimes(2);
    });

    it("does not attempt a refresh when the caller opts out", async () => {
      const refresh = vi.fn().mockResolvedValue(true);
      configureAuth({ getAccessToken: () => "expired", refresh });
      vi.mocked(fetch).mockResolvedValue(failure(401, "UNAUTHORIZED"));

      // The refresh call itself uses this, or it would recurse forever.
      await request("/admin/auth/refresh", { skipAuthRetry: true }).catch(() => undefined);

      expect(refresh).not.toHaveBeenCalled();
    });
  });

  describe("requests", () => {
    it("sends the bearer token when one is available", async () => {
      configureAuth({ getAccessToken: () => "token-123", refresh: async () => false });
      vi.mocked(fetch).mockResolvedValueOnce(success(null));

      await api.get("/admin/auth/me");

      const init = vi.mocked(fetch).mock.calls[0][1];
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer token-123");
    });

    it("omits the Authorization header when there is no session", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(success(null));

      await api.post("/admin/auth/login", { email: "a@b.c" });

      const init = vi.mocked(fetch).mock.calls[0][1];
      expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it("sends the refresh cookie", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(success(null));

      await api.get("/admin/auth/me");

      expect(vi.mocked(fetch).mock.calls[0][1]?.credentials).toBe("include");
    });

    it("returns undefined for 204 rather than failing to parse", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

      await expect(api.delete("/admin/users/u1/sessions/s1")).resolves.toBeUndefined();
    });
  });

  /**
   * AC#3. These field names mirror `shared/response/PageResponse.java`; a rename on either
   * side has to be a deliberate, visible change rather than a silently undefined property.
   */
  it("PageResponse mirrors the backend record field for field", async () => {
    const page: PageResponse<{ id: string }> = {
      content: [{ id: "u1" }],
      page: 0,
      size: 25,
      totalElements: 1284,
      totalPages: 52,
      hasNext: true,
    };
    vi.mocked(fetch).mockResolvedValueOnce(success(page));

    const result = await api.get<PageResponse<{ id: string }>>("/admin/users");

    expect(Object.keys(result).sort()).toEqual(
      ["content", "hasNext", "page", "size", "totalElements", "totalPages"].sort(),
    );
    expect(result.page).toBe(0);
    expect(result.hasNext).toBe(true);
  });
});
