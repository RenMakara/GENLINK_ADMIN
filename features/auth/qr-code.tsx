"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders an `otpauth://` URI as a QR code.
 *
 * <h2>Generated locally, never by a service</h2>
 *
 * The URI contains the TOTP secret. Sending it to a third-party QR generator — the obvious
 * shortcut, and one that appears in a lot of tutorials — would hand a working second factor to
 * whoever runs that service, and leave it in their logs. `qrcode` renders in the browser and
 * the string never leaves the page.
 *
 * <p>Rendered as an SVG string rather than a canvas: it stays sharp on a high-density phone
 * screen held up to a laptop, which is exactly how it will be used, and it needs no ref or
 * imperative draw call.
 */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toString(value, {
      type: "svg",
      width: size,
      margin: 1,
      // Fixed black-on-white regardless of theme. Scanners want maximum contrast, and a QR
      // rendered in muted "dark mode" colours is measurably harder to read — this is one of
      // the few places where following the theme would make the product worse.
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    // Never a dead end: the manual key below the QR is a complete alternative, so a failed
    // render is an inconvenience rather than a blocked enrolment.
    return (
      <div
        role="status"
        className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm"
        style={{ width: size, height: size }}
      >
        Could not draw the QR code. Use the setup key below instead.
      </div>
    );
  }

  if (!svg) {
    return <div className="bg-muted animate-pulse rounded-lg" style={{ width: size, height: size }} />;
  }

  return (
    <div
      // The QR is decorative for assistive technology: it encodes the same secret shown as text
      // immediately below, and reading a QR aloud helps nobody.
      aria-hidden
      className="rounded-lg bg-white p-3"
      style={{ width: size + 24 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
