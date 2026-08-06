"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Light/dark switch.
 *
 * <p>Both icons are rendered and CSS picks one from the `.dark` class on `<html>`. The usual
 * next-themes pattern — a `mounted` flag set in an effect — is avoided deliberately: the
 * server cannot know the stored theme, so rendering from it produces a hydration mismatch,
 * and the flag that works around it trips `react-hooks/set-state-in-effect` under React 19.
 * Letting CSS decide sidesteps both, with no flash of the wrong icon.
 *
 * <p>`resolvedTheme` is still read for the click handler. That is safe because it only runs
 * on the client, where the theme is known.
 *
 * <p>Icon-only, so it carries an `aria-label` — without one a screen reader announces
 * "button" and nothing more (SSOT §11.8). The label is static rather than describing the
 * current state, because the state is not known during server render.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle light or dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </Button>
  );
}
