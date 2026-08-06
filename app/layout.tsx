import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Kantumruy_Pro } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

/**
 * Latin UI face, matching the mobile app (SSOT §11.3 / DESIGN_SYSTEM.md).
 *
 * `display: "swap"` renders fallback text immediately rather than holding the page blank
 * while the font loads — next/font's default, stated here because it is a requirement.
 */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Khmer face. The admin UI is English-first, but user-generated content and bilingual entity
 * fields render in Khmer, so the face has to be present from the start — a Khmer name in a
 * user table otherwise falls back to whatever the OS supplies.
 */
const kantumruy = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GenLink KH Admin",
  description: "Staff administration portal for GenLink KH",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    // suppressHydrationWarning is required by next-themes: it sets the class on <html>
    // before React hydrates, so server and client markup differ by design.
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${kantumruy.variable} h-full antialiased`}
    >
      {/*
        suppressHydrationWarning here is for browser extensions, not for our own markup.
        Password managers, antivirus and privacy extensions inject attributes onto <body>
        (bis_register, __processed_<uuid>__, data-new-gr-c-s-check-loaded and friends) before
        React hydrates, which React reports as a mismatch it "won't patch up".

        It suppresses attribute and text differences on this element only — children are still
        checked — so a genuine hydration bug in the tree below still surfaces.
      */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <ThemeProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
