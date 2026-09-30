import { describe, expect, it } from "vitest";

import { authErrorMessage, redirectsToEnrolment } from "./error-messages";

describe("sign-in error messages (ADM-036 AC#1–3)", () => {
  /** Keep password errors actionable without revealing which credential was wrong. */
  it("a rejected password says what to do without revealing which field was wrong", () => {
    const message = authErrorMessage("UNAUTHORIZED");

    expect(message.title).toBe("Email or password is incorrect");
    expect(message.title.toLowerCase()).not.toContain("no such");
    expect(message.title.toLowerCase()).not.toContain("not an admin");
    expect(message.title.toLowerCase()).not.toContain("not found");
  });

  /** Explain lockout timing and warn that retries extend it. */
  it("rate limiting is shown as a lockout with a duration", () => {
    const message = authErrorMessage("RATE_LIMITED");

    expect(message.tone).toBe("warning");
    expect(message.detail).toContain("15 minutes");
    expect(message.detail).toMatch(/do not shorten it/i);
  });

  it("a rejected code does not imply the password was wrong", () => {
    const message = authErrorMessage("ADMIN_MFA_INVALID");

    expect(message.title).toBe("That code was not accepted");
    expect(message.detail).toMatch(/30 seconds/);
    expect(message.detail).toMatch(/recovery/i);
  });

  /** AC#3 — handled by navigating, not by a message. */
  it("an unenrolled admin is routed to enrolment", () => {
    expect(redirectsToEnrolment("ADMIN_MFA_NOT_ENROLLED")).toBe(true);
    expect(redirectsToEnrolment("ADMIN_MFA_INVALID")).toBe(false);
    expect(redirectsToEnrolment(undefined)).toBe(false);
  });

  it("never answers with a bare 'invalid input'", () => {
    for (const code of [
      "UNAUTHORIZED",
      "RATE_LIMITED",
      "ADMIN_MFA_INVALID",
      "CHALLENGE_MISSING",
      "CSRF_TOKEN_INVALID",
      "SOMETHING_NOBODY_MAPPED",
    ]) {
      expect(authErrorMessage(code).title.toLowerCase()).not.toBe("invalid input");
      expect(authErrorMessage(code).title.length).toBeGreaterThan(8);
    }
  });

  /** Include unknown error codes so support can identify the failure. */
  it("an unmapped code names itself so it can be reported", () => {
    expect(authErrorMessage("ADMIN_SUDO_REQUIRED").detail).toContain("ADMIN_SUDO_REQUIRED");
  });

  /** A network failure is not an auth failure and must not be reported as one. */
  it("no code at all reads as a connection problem", () => {
    const message = authErrorMessage(undefined);

    expect(message.title).toMatch(/could not reach/i);
    expect(message.title.toLowerCase()).not.toContain("password");
  });
});
