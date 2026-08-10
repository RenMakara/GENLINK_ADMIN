"use client";

import { useState, type ReactNode } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { cn } from "@/lib/utils";

/**
 * The frame every dashboard page renders inside (SSOT §3, ADM-034).
 *
 * <h2>Two presentations of one navigation</h2>
 *
 * At or above 768px a fixed rail: 264px, collapsible to 64px, state persisted. Below it the rail
 * is gone entirely and the same {@link SidebarNav} renders inside a sheet — at that width a
 * permanent 264px rail leaves too little for a data table, and a 64px icon rail is unusable on
 * touch (AC#3).
 *
 * <p>The two share one component, so a link cannot exist in one and not the other.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed, toggle, animate } = useSidebarState();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-svh">
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      <aside
        aria-label="Sidebar"
        className={cn(
          "bg-sidebar sticky top-0 hidden h-svh shrink-0 border-r md:block",
          collapsed ? "w-16" : "w-66",
          // Armed one frame after the stored width is applied. Enabling it any earlier means
          // a sidebar that should have started collapsed visibly slides shut on every load.
          animate && "transition-[width] duration-200 ease-out",
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              collapsed && "sr-only",
            )}
          >
            GenLink KH
          </span>
          {collapsed && (
            <span aria-hidden className="w-full text-center text-sm font-semibold">
              G
            </span>
          )}
        </div>
        <SidebarNav collapsed={collapsed} />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <SheetTitle className="text-sm font-semibold">GenLink KH</SheetTitle>
          </div>
          {/* Never collapsed in the sheet: it has the room, and icons alone are a poor
              touch target with no hover to reveal a tooltip. */}
          <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          collapsed={collapsed}
          onToggleSidebar={toggle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        {/* max-w-[1600px] per SSOT §3: a data table stretched across an ultrawide monitor is
            unreadable, because the eye loses the row between the first and last column. */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
