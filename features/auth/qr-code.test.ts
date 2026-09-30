import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";

/** Decodes generated QR images with an independent reader to verify their contents. */

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

  /** Keep `@` readable in the authenticator label. */
  it("keeps the account label readable", async () => {
    const decoded = await roundTrip(URI);

    expect(decoded).toContain("GenLink%20KH%20Admin:makara@genlink.kh");
  });

  /** Pin algorithm, digit count, and period for authenticator compatibility. */
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
