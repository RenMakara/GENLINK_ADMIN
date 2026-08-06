"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Toast host.
 *
 * <p>Toasts announce success — "User banned", "Export ready". They are deliberately **not**
 * the channel for errors that need a decision (SSOT §11.7): a toast disappears, and an admin
 * who missed it has no way to get it back. Failures that require action belong in the dialog
 * or the form that caused them.
 *
 * <p>Reads the resolved theme so toasts follow the app rather than sitting in whichever mode
 * sonner defaults to.
 *
 * <p>`richColors` maps sonner's semantic variants onto visible colour, but every toast still
 * carries text — colour is never the only signal (SSOT §11.2).
 */
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
