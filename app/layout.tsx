import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Kantumruy_Pro } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Providers } from "@/providers";
import "./globals.css";

/** Latin UI font; `swap` keeps text visible while it loads. */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/** Khmer font for user content and bilingual fields. */
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
      {/* Browser extensions may add body attributes before hydration. */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <Providers>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
