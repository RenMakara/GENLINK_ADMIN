"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Trigger for the global ⌘K / Ctrl+K command palette (SSOT §3, ADM-057). */
interface CommandPaletteTriggerProps {
  /** Optional click handler to open the command palette */
  onClick?: () => void;
}

/**
 * Trigger button for the ⌘K Command Palette (SSOT §3, ADM-057).
 */
export function CommandPaletteTrigger({ onClick }: CommandPaletteTriggerProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      title="Open Command palette (⌘K)"
      aria-label="Open Command palette (⌘K)"
      className="text-muted-foreground hidden h-8 gap-2 px-2.5 font-normal sm:flex"
    >
      <Search className="size-3.5" aria-hidden />
      <span className="hidden lg:inline">Search…</span>
      <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </Button>
  );
}
