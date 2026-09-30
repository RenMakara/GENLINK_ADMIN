"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { activeItem, visibleGroups } from "@/config/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavProps {
  collapsed: boolean;
  /** Closes the mobile sheet on navigation; a no-op on desktop. */
  onNavigate?: () => void;
}

/** Navigation list shared by desktop and mobile layouts. */
export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  // Permissions come from /admin/auth/me, resolved from the caller's own granted authorities -
  // so the sidebar cannot show a page the backend would refuse. null while the session is still
  // loading, which renders every shipped item rather than flashing an empty rail and filling it
  // in a moment later (ADM-035).
  const { permissions } = useAuth();
  const groups = visibleGroups(permissions);
  const active = activeItem(pathname);

  return (
    <TooltipProvider delayDuration={0}>
      <nav aria-label="Main" className="flex flex-col gap-6 px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {/* Hidden rather than removed when collapsed: screen readers keep the grouping. */}
            <h2
              className={cn(
                "px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
                collapsed && "sr-only",
              )}
            >
              {group.label}
            </h2>

            {group.items.map((item) => {
              const isActive = active?.href === item.href;
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80 hover:bg-accent/50 hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                      {/* Keep collapsed labels out of the DOM; icon links retain accessible names. */}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && <span className="sr-only">{item.label}</span>}
                </Link>
              );

              // Collapsed to icons, the tooltip is the only way to know what a glyph means.
              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}
