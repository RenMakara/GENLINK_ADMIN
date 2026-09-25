"use client";

import { useAuth } from "@/features/auth/auth-provider";

/** The session projection used by management views that need the current admin's role. */
export function useCurrentAdmin() {
  return useAuth().session;
}

/** The signed-in administrator identity used for self-protection in management views. */
export function useCurrentAdminId(): string | null {
  return useCurrentAdmin()?.adminUserId ?? null;
}
