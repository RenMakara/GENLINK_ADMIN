import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";

/**
 * ADM-037 AC#1 — "the QR scans correctly in a standard authenticator app".
 *
 * <p>A test cannot hold a phone up to a screen, but it can do the part that actually goes
 * wrong: generate the code, then **decode it with an independent reader** and check the bytes
 * that come back are the URI we put in. `qrcode` writes it and `jsqr` reads it — two libraries
 * that share no code, which is what makes the round trip worth anything.
 *
 * <p>What this does not prove is that a particular app accepts the *contents*. That is covered
 * separately: `AdminMfaEnrolmentServiceTest` pins the Key Uri Format, and the format was
 * confirmed against a real authenticator during ADM-022.
 */

const URI =
  "otpauth://totp/GenLink%20KH%20Admin:makara@genlink.kh" +
  "?secret=4QPTSC4EBY6JO47FJIORIEFJM6FEXAZK&issuer=GenLink%20KH%20Admin" +
  "&algorithm=SHA1&digits=6&period=30";

/** Renders to PNG and decodes it, the way a camera would see it. */
async function roundTrip(value: string): Promise<string | null> {
  const buffer = await QRCode.toBuffer(value, {
    type: "png",
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  const png = PNG.sync.read(buffer);
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result?.data ?? null;
}

describe("QR round trip", () => {
  it("decodes back to exactly the URI it encoded", async () => {
    expect(await roundTrip(URI)).toBe(URI);
  });

  /** The secret is the payload. A truncated or re-encoded one produces codes that never match. */
  it("preserves the secret exactly", async () => {
    const decoded = await roundTrip(URI);

    expect(decoded).toContain("secret=4QPTSC4EBY6JO47FJIORIEFJM6FEXAZK");
  });

  /**
   * The `@` is left literal in the label (ADM-022). An app that splits on `:` without
   * URL-decoding would otherwise show `makara%40genlink.kh`.
   */
  it("keeps the account label readable", async () => {
    const decoded = await roundTrip(URI);

    expect(decoded).toContain("GenLink%20KH%20Admin:makara@genlink.kh");
  });

  /**
   * These are spelled out rather than left to defaults because some apps do not apply the
   * defaults, and one that assumes SHA-256 produces numbers that never match.
   */
  it("carries the algorithm parameters through", async () => {
    const decoded = await roundTrip(URI);

    expect(decoded).toContain("algorithm=SHA1");
    expect(decoded).toContain("digits=6");
    expect(decoded).toContain("period=30");
  });

  /** A long URI must not silently overflow the chosen error-correction level. */
  it("survives a long issuer and account", async () => {
    const long =
      "otpauth://totp/A%20Rather%20Long%20Organisation%20Name:" +
      "someone.with.a.long.address@a-long-domain-name.example" +
      "?secret=4QPTSC4EBY6JO47FJIORIEFJM6FEXAZK&issuer=A%20Rather%20Long%20Organisation%20Name" +
      "&algorithm=SHA1&digits=6&period=30";

    expect(await roundTrip(long)).toBe(long);
  });
});
