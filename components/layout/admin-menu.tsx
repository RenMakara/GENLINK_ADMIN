"use client";

import { LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The admin avatar menu (SSOT §3).
 *
 * <p>Identity and sign-out both arrive with the auth provider in ADM-035 — there is no session
 * to read from yet. The menu renders its shape with the items disabled rather than being left
 * out, so the topbar is not rearranged later and it is obvious what is still missing.
 */
export function AdminMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Account menu"
          className="size-8 shrink-0 rounded-full"
        >
          <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium">
            <User className="size-4" aria-hidden />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="text-muted-foreground block text-xs">Signed in as</span>
          {/* Real identity comes from /admin/auth/me once ADM-035 provides it. */}
          <span className="block truncate text-sm font-medium">—</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-2">
          <LogOut className="size-4" aria-hidden />
          Sign out
          <span className="sr-only">(available once sign-in is wired up)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
