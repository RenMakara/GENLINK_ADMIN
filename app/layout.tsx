import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenLink KH Admin",
  description: "Staff administration portal for GenLink KH",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolved by i18n/request.ts. Fixed to 'en' today (ADM-012), but read rather than
  // hard-coded so adding a locale later does not mean editing the layout.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          Wraps everything so client components can call useTranslations. Server components
          reach the same messages without it, but the provider has to be here for the client
          half of the app — which is most of an admin dashboard.
        */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
