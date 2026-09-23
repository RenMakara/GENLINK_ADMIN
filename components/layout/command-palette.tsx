"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Laptop,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

import { MVP_QUICK_ACTIONS } from "@/components/dashboard/quick-actions-panel";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { visibleGroups } from "@/config/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";
import { useUserSearch } from "@/services/users";
import type { AdminUserTableRow } from "@/features/users/types";

export interface CommandPaletteItem {
  id: string;
  label: string;
  category: "Navigation" | "Quick Actions" | "Theme" | "Users";
  icon: ComponentType<LucideProps>;
  onSelect: () => void;
  keywords?: string;
  description?: string;
}

export interface CommandPaletteProps {
  /** Controls open/close state */
  open: boolean;
  /** State change handler */
  onOpenChange: (open: boolean) => void;
  /** Explicit permissions array for unit tests */
  userPermissions?: string[] | null;
}

/**
 * Global ⌘K / Ctrl+K Command Palette (SSOT §3, ADM-057).
 *
 * <p>Permission-filtered via `visibleGroups(permissions)` and viewer grants. Fully keyboard
 * operable with Escape to close, arrows to highlight, and Enter to execute.
 */
export function CommandPalette({ open, onOpenChange, userPermissions }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncedUserQuery, setDebouncedUserQuery] = useState("");

  // Read permissions from context if not passed explicitly
  let activePermissions: string[] | null = null;
  try {
    const auth = useAuth();
    activePermissions = userPermissions ?? auth.permissions;
  } catch {
    activePermissions = userPermissions ?? null;
  }

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setSelectedIndex(0);
  }, [onOpenChange]);

  // 1. Navigation items (Permission-filtered via visibleGroups)
  const navGroups = useMemo(() => visibleGroups(activePermissions), [activePermissions]);
  const canSearchUsers = activePermissions?.includes("user:read") ?? false;

  // ADM-076: keep command filtering immediate, but delay the network-backed user search.
  useEffect(() => {
    const normalized = query.trim();
    const timer = window.setTimeout(() => setDebouncedUserQuery(normalized), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const userSearch = useUserSearch(debouncedUserQuery, open && canSearchUsers);
  const normalizedQuery = query.trim();
  const showUserResults =
    canSearchUsers && normalizedQuery.length > 0 && debouncedUserQuery === normalizedQuery;

  const userItems = useMemo<CommandPaletteItem[]>(() => {
    if (!showUserResults) return [];

    return (userSearch.data?.content ?? []).map((user: AdminUserTableRow) => {
      const username = user.username ? `@${user.username.replace(/^@/, "")}` : "";
      const description = [user.email, username].filter(Boolean).join(" · ");
      const label = user.fullName || username || user.email || "Unnamed user";

      return {
        id: `user-${user.userId}`,
        label,
        description,
        category: "Users",
        icon: UserRound,
        keywords: `${user.fullName} ${user.email} ${user.username}`,
        onSelect: () => {
          close();
          router.push(`/users/${encodeURIComponent(user.userId)}`);
        },
      };
    });
  }, [close, router, showUserResults, userSearch.data?.content]);

  const items = useMemo<CommandPaletteItem[]>(() => {
    const list: CommandPaletteItem[] = [];

    // Navigation items
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        list.push({
          id: `nav-${item.href}`,
          label: item.label,
          category: "Navigation",
          icon: item.icon,
          keywords: `${group.label} ${item.label} ${item.href}`,
          onSelect: () => {
            close();
            router.push(item.href);
          },
        });
      });
    });

    // User results are gated on user:read and are populated by the debounced ADM-060 search.
    list.push(...userItems);

    const activePerms = activePermissions ?? [];

    // Quick Actions (Permission-filtered)
    MVP_QUICK_ACTIONS.forEach((action) => {
      if (activePerms.includes(action.permission)) {
        list.push({
          id: `action-${action.id}`,
          label: action.label,
          category: "Quick Actions",
          icon: action.icon,
          keywords: `${action.label} ${action.description}`,
          onSelect: () => {
            close();
            router.push(action.href);
          },
        });
      }
    });

    // Theme controls
    list.push(
      {
        id: "theme-light",
        label: "Switch to Light mode",
        category: "Theme",
        icon: Sun,
        keywords: "theme light mode day",
        onSelect: () => {
          setTheme("light");
          close();
        },
      },
      {
        id: "theme-dark",
        label: "Switch to Dark mode",
        category: "Theme",
        icon: Moon,
        keywords: "theme dark mode night",
        onSelect: () => {
          setTheme("dark");
          close();
        },
      },
      {
        id: "theme-system",
        label: "Use System theme",
        category: "Theme",
        icon: Laptop,
        keywords: "theme system auto",
        onSelect: () => {
          setTheme("system");
          close();
        },
      },
    );

    return list;
  }, [navGroups, activePermissions, router, setTheme, close, userItems]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.toLowerCase().includes(q)),
    );
  }, [items, query]);

  // Global ⌘K / Ctrl+K keyboard shortcut listener (AC#3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Keyboard navigation within the palette (AC#1)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filteredItems.length - 1) : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="mx-auto mt-12 max-w-2xl rounded-xl border p-0 shadow-2xl overflow-hidden inset-x-4 sm:inset-x-auto"
      >
        <SheetTitle className="sr-only">Command Palette</SheetTitle>
        <div className="flex flex-col w-full bg-background text-foreground" onKeyDown={handleKeyDown}>
          {/* Search input header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="size-4 text-muted-foreground shrink-0" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              aria-label="Command search"
              autoFocus
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
              ESC
            </kbd>
          </div>

          {/* Action List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {canSearchUsers && normalizedQuery.length > 0 && !showUserResults ? (
              <div role="status" className="px-3 pb-2 text-xs text-muted-foreground">
                Searching users…
              </div>
            ) : null}
            {canSearchUsers && showUserResults && userSearch.isLoading ? (
              <div role="status" className="px-3 pb-2 text-xs text-muted-foreground">
                Searching users…
              </div>
            ) : null}
            {filteredItems.length === 0 ? (
              canSearchUsers && showUserResults && userSearch.isLoading ? null :
              <div className="p-4 text-center text-sm text-muted-foreground">
                {canSearchUsers && showUserResults
                  ? "No matching users or commands found"
                  : "No matching commands or pages found"}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.onSelect()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-accent/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{item.label}</span>
                          {item.description ? (
                            <span className="truncate text-xs font-normal text-muted-foreground">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
