import { describe, expect, it } from "vitest";

import { apiError, apiResponse, bulkResult, pageResponse } from "./factories";

describe("apiResponse", () => {
  it("builds a success envelope carrying the data", () => {
    const envelope = apiResponse({ id: "u1" });

    expect(envelope).toEqual({
      success: true,
      message: "OK",
      data: { id: "u1" },
      timestamp: "2026-08-10T12:00:00.000Z",
    });
  });

  it("omits errorCode entirely on success, matching the backend's NON_NULL serialisation", () => {
    // A present-but-empty errorCode would not match the wire shape the client unwraps.
    expect(apiResponse(null)).not.toHaveProperty("errorCode");
  });

  it("takes message and timestamp overrides", () => {
    const envelope = apiResponse({ ok: true }, { message: "Created", timestamp: "2026-01-01T00:00:00.000Z" });
    expect(envelope.message).toBe("Created");
    expect(envelope.timestamp).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("apiError", () => {
  it("builds a failure envelope with the code and no data", () => {
    const envelope = apiError("RATE_LIMITED");

    expect(envelope.success).toBe(false);
    expect(envelope.errorCode).toBe("RATE_LIMITED");
    // message defaults to the code so a fixture never invents human copy.
    expect(envelope.message).toBe("RATE_LIMITED");
    // data is absent, mirroring @JsonInclude(NON_NULL).
    expect(envelope).not.toHaveProperty("data");
  });

  it("keeps a supplied diagnostic message", () => {
    expect(apiError("VALIDATION_ERROR", { message: "email must not be blank" }).message).toBe(
      "email must not be blank",
    );
  });
});

describe("pageResponse", () => {
  it("derives totalPages and hasNext rather than trusting inputs", () => {
    const page = pageResponse([1, 2], { page: 0, size: 25, totalElements: 60 });

    expect(page.totalPages).toBe(3); // ceil(60 / 25)
    expect(page.hasNext).toBe(true); // page 0 of 3
  });

  it("reports no next page on the last one", () => {
    const page = pageResponse([1], { page: 2, size: 25, totalElements: 60 });
    expect(page.hasNext).toBe(false); // page 2 is the last (0-based)
  });

  it("defaults totalElements to the content length — a single full page", () => {
    const page = pageResponse([1, 2, 3]);

    expect(page.page).toBe(0);
    expect(page.size).toBe(25);
    expect(page.totalElements).toBe(3);
    expect(page.totalPages).toBe(1);
    expect(page.hasNext).toBe(false);
  });

  it("is empty-safe", () => {
    const page = pageResponse<number>([]);
    expect(page.totalPages).toBe(0);
    expect(page.hasNext).toBe(false);
  });
});

describe("bulkResult", () => {
  it("holds the fixed partial-success shape (SSOT §8 C-3)", () => {
    const failed = [{ id: "u3", errorCode: "USER_ALREADY_BANNED" }];
    const result = bulkResult({ requested: 3, failed });

    expect(result).toEqual({
      batchId: "00000000-0000-0000-0000-000000000000",
      requested: 3,
      succeeded: 2, // requested - failed.length
      failed,
    });
  });

  it("defaults an all-success batch", () => {
    const result = bulkResult({ requested: 5 });
    expect(result.succeeded).toBe(5);
    expect(result.failed).toEqual([]);
  });
});
