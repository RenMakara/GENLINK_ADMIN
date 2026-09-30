"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/** Success toast host; actionable errors stay in their form or dialog. */
export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      richColors
      closeButton
      // Long enough to read a sentence without hurrying, short enough not to stack up
      // during a bulk operation.
      duration={5000}
    />
  );
}
