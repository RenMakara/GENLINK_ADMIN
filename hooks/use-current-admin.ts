"use client";

import { useAuth } from "@/features/auth/auth-provider";

/** The signed-in administrator identity used for self-protection in management views. */
export function useCurrentAdminId(): string | null {
  return useAuth().session?.adminUserId ?? null;
}
