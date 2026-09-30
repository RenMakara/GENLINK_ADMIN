"use client";

import { useState, type ReactNode } from "react";

import { GenLinkLogo } from "@/components/common";
import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { cn } from "@/lib/utils";

/** Shared responsive frame for signed-in pages. */
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
          <GenLinkLogo size="sm" iconOnly={collapsed} />
        </div>
        <SidebarNav collapsed={collapsed} />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <SheetTitle className="sr-only">GenLink KH Navigation</SheetTitle>
            <GenLinkLogo size="sm" />
          </div>
          {/* Keep mobile navigation expanded for touch users. */}
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
        {/* Limit page width to keep wide tables readable. */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
