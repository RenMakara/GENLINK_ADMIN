"use client";

import { LogOut, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminSecurityDialog } from "@/features/auth/admin-security-dialog";
import { useAuth } from "@/features/auth/auth-provider";
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
 * <p>Identity and sign-out come from the session (ADM-035). Sign-out revokes the refresh cookie
 * and the access token's session server-side, so it takes effect immediately rather than when
 * the token would have expired.
 */
export function AdminMenu() {
  const { session, signOut } = useAuth();
  const [securityOpen, setSecurityOpen] = useState(false);

  return (
    <>
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
            <span className="block truncate text-sm font-medium">{session?.email ?? "—"}</span>
            {session ? (
              <span className="text-muted-foreground block truncate text-xs">
                {session.roleName}
              </span>
            ) : null}
            {session ? (
              <span className="text-muted-foreground block truncate text-xs">
                {session.totpEnabled ? "2FA enabled" : "2FA setup required"}
              </span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setSecurityOpen(true)} className="gap-2">
            <ShieldCheck className="size-4" aria-hidden />
            Security &amp; 2FA
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOut()} className="gap-2">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AdminSecurityDialog open={securityOpen} onOpenChange={setSecurityOpen} session={session} />
    </>
  );
}
