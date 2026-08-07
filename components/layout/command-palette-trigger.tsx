"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Placeholder for the ⌘K palette (SSOT §3).
 *
 * <p>Deliberately inert and deliberately visible. Disabled rather than hidden so the shell shows
 * its intended shape, and `title`/`aria-label` say why, so nobody files a bug about a button that
 * does nothing. Search is a later phase; a trigger that opened an empty dialog would be worse
 * than one that plainly says "not yet".
 */
export function CommandPaletteTrigger() {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      title="Command palette — not implemented yet"
      aria-label="Command palette — not implemented yet"
      className="text-muted-foreground hidden h-8 gap-2 px-2.5 font-normal sm:flex"
    >
      <Search className="size-3.5" aria-hidden />
      <span className="hidden lg:inline">Search…</span>
      <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </Button>
  );
}
