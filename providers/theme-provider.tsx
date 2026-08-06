"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Light/dark theming.
 *
 * <p>Defaults to **dark** (SSOT §11.2): this is an internal tool staff have open all day, and
 * `defaultTheme="system"` alone would leave that to whatever the OS happens to be set to.
 * `enableSystem` still lets an admin choose "System" explicitly, and the choice persists.
 *
 * <p>`disableTransitionOnChange` stops every transition on the page from firing at once when
 * the theme flips, which otherwise reads as the UI glitching rather than switching.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="genlink-admin-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
