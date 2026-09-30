import { describe, expect, it } from "vitest";

import messages from "@/messages/en.json";

import { ApiError, ERROR_CODES, errorMessageKey, isKnownErrorCode } from "./errors";

describe("error contract", () => {
  /** Every API error code has a user-facing message. */
  it("every error code has a message", () => {
    const translated = Object.keys(messages.Errors);
    const missing = ERROR_CODES.filter((code) => !translated.includes(code));

    expect(missing).toEqual([]);
  });

  it("has the fallbacks the client needs for cases with no server code", () => {
    // Thrown for an unrecognised code and for a transport failure respectively.
    expect(messages.Errors).toHaveProperty("UNKNOWN");
    expect(messages.Errors).toHaveProperty("NETWORK");
  });

  it("covers every code in the SSOT §8 C-2 table", () => {
    // Transcribed from the SSOT rather than from the implementation, so this fails if a code
    // is dropped from the union.
    const fromSsot = [
      "ADMIN_MFA_REQUIRED",
      "ADMIN_MFA_INVALID",
      "ADMIN_MFA_NOT_ENROLLED",
      "ADMIN_SUDO_REQUIRED",
      "ADMIN_TOKEN_TYPE_INVALID",
      "ADMIN_SELF_MODIFICATION",
      "ADMIN_LAST_SUPER_ADMIN",
      "USER_ALREADY_BANNED",
      "USER_NOT_BANNED",
      "USER_ANONYMISED",
      "EXPORT_TOO_LARGE",
      "BULK_LIMIT_EXCEEDED",
      "RATE_LIMITED",
      // The shared codes GlobalExceptionHandler already returns.
      "NOT_FOUND",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "VALIDATION_ERROR",
      "INTERNAL_SERVER_ERROR",
    ];

    expect(fromSsot.filter((code) => !isKnownErrorCode(code))).toEqual([]);
  });

  it("maps a known code to its own key", () => {
    const error = new ApiError({ status: 403, rawCode: "ADMIN_SUDO_REQUIRED" });

    expect(errorMessageKey(error)).toBe("ADMIN_SUDO_REQUIRED");
  });

  it("falls back rather than showing a raw code to a member of staff", () => {
    const error = new ApiError({ status: 400, rawCode: "SOMETHING_NEW" });

    expect(errorMessageKey(error)).toBe("UNKNOWN");
    expect(error.rawCode).toBe("SOMETHING_NEW");
  });

  it("flags an expired session distinctly from a permission failure", () => {
    expect(new ApiError({ status: 401, rawCode: "UNAUTHORIZED" }).isAuthError).toBe(true);
    // A 403 means "your role does not allow this", which re-authenticating will not fix.
    expect(new ApiError({ status: 403, rawCode: "FORBIDDEN" }).isAuthError).toBe(false);
  });
});
