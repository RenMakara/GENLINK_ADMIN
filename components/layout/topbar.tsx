"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { AdminMenu } from "@/components/layout/admin-menu";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandPaletteTrigger } from "@/components/layout/command-palette-trigger";
import { EnvironmentBadge } from "@/components/layout/environment-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
  onOpenCommandPalette?: () => void;
}

/** Sticky shell controls, including the environment badge. */
export function Topbar({
  collapsed,
  onToggleSidebar,
  onOpenMobileNav,
  onOpenCommandPalette,
}: TopbarProps) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
      {/* Below md the rail is gone, so this opens the sheet instead of collapsing. */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="size-8 shrink-0 md:hidden"
      >
        <Menu className="size-4" aria-hidden />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
        className="hidden size-8 shrink-0 md:inline-flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" aria-hidden />
        ) : (
          <PanelLeftClose className="size-4" aria-hidden />
        )}
      </Button>

      {/* min-w-0 so a long trail truncates instead of pushing the controls off screen. */}
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <CommandPaletteTrigger onClick={onOpenCommandPalette} />
        <EnvironmentBadge />
        <ThemeToggle />
        <AdminMenu />
      </div>
    </header>
  );
}
