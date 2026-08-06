import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { createQueryClient } from "./query-client";

/** Pulls the configured defaults back out, so these test what the app actually runs with. */
function queryDefaults() {
  return createQueryClient().getDefaultOptions().queries!;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  const retry = queryDefaults().retry as (count: number, error: unknown) => boolean;
  return retry(failureCount, error);
}

describe("query client defaults", () => {
  it("does not refetch when the window regains focus", () => {
    // An admin has this open all day beside other tabs. Refetching on focus would re-fire
    // every dashboard query each time they tab back.
    expect(queryDefaults().refetchOnWindowFocus).toBe(false);
  });

  it("does refetch on reconnect", () => {
    // Unlike focus, regaining a connection is a real signal that data may have moved on.
    expect(queryDefaults().refetchOnReconnect).toBe(true);
  });

  it("keeps data fresh for 30 seconds", () => {
    expect(queryDefaults().staleTime).toBe(30_000);
  });

  it("never retries a mutation", () => {
    // A ban or an XP grant that silently ran twice is far worse than one that visibly
    // failed once.
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });

  describe("retry policy", () => {
    it("retries a 500 once, then stops", () => {
      const serverError = new ApiError({ status: 500, rawCode: "INTERNAL_SERVER_ERROR" });

      expect(shouldRetry(0, serverError)).toBe(true);
      expect(shouldRetry(1, serverError)).toBe(false);
    });

    it("retries a network failure", () => {
      expect(shouldRetry(0, new ApiError({ status: 0, rawCode: "NETWORK" }))).toBe(true);
    });

    it("does not retry a 403 — the role will not change on a second attempt", () => {
      expect(shouldRetry(0, new ApiError({ status: 403, rawCode: "FORBIDDEN" }))).toBe(false);
    });

    it("does not retry a 404", () => {
      expect(shouldRetry(0, new ApiError({ status: 404, rawCode: "NOT_FOUND" }))).toBe(false);
    });

    it("does not retry a validation error", () => {
      expect(shouldRetry(0, new ApiError({ status: 400, rawCode: "VALIDATION_ERROR" }))).toBe(false);
    });

    it("does not retry a rate limit — retrying is what caused it", () => {
      expect(shouldRetry(0, new ApiError({ status: 429, rawCode: "RATE_LIMITED" }))).toBe(false);
    });

    it("does not retry an expired session; the client already refreshed and failed", () => {
      expect(shouldRetry(0, new ApiError({ status: 401, rawCode: "UNAUTHORIZED" }))).toBe(false);
    });

    it("retries an unrecognised error once, rather than assuming it is fatal", () => {
      expect(shouldRetry(0, new Error("boom"))).toBe(true);
      expect(shouldRetry(1, new Error("boom"))).toBe(false);
    });
  });
});
