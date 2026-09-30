import { describe, expect, it } from "vitest";

import { loginSchema, mfaSchema, normaliseCode } from "./schemas";

describe("login schema", () => {
  it("accepts a valid pair", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("requires both fields with messages an admin can act on", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    const messages = result.error?.issues.map((issue) => issue.message) ?? [];

    expect(messages).toContain("Enter your email address");
    expect(messages).toContain("Enter your password");
  });

  it("rejects something that is not an email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  /** Accept legacy passwords without client-side length rules. */
  it("imposes no length or complexity rule on the password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "a" }).success).toBe(true);
  });
});

describe("mfa schema", () => {
  it("accepts a 6-digit code", () => {
    expect(mfaSchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  /** Leading zeros are ordinary in TOTP and must survive. */
  it("accepts a code starting with zeros", () => {
    expect(mfaSchema.safeParse({ code: "000123" }).success).toBe(true);
  });

  it("accepts a recovery code, formatted or not", () => {
    expect(mfaSchema.safeParse({ code: "ABCDE-FGHJK" }).success).toBe(true);
    expect(mfaSchema.safeParse({ code: "ABCDEFGHJK" }).success).toBe(true);
  });

  it("tolerates the spacing people type", () => {
    expect(mfaSchema.safeParse({ code: "123 456" }).success).toBe(true);
  });

  it("rejects the wrong number of digits", () => {
    expect(mfaSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(mfaSchema.safeParse({ code: "1234567" }).success).toBe(false);
  });

  /** Recovery codes should not receive the TOTP length error. */
  it("its message mentions recovery codes", () => {
    const result = mfaSchema.safeParse({ code: "nope" });

    expect(result.error?.issues[0]?.message).toMatch(/recovery/i);
  });
});

describe("normaliseCode", () => {
  it("strips spacing and upper-cases, so what is typed reaches the server in the expected shape", () => {
    expect(normaliseCode("123 456")).toBe("123456");
    expect(normaliseCode("abcde-fghjk")).toBe("ABCDE-FGHJK");
  });
});
