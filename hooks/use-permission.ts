"use client";

import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/auth-provider";
import { toPermissions, type Permission } from "@/types/permissions";

/** UI visibility check only; always enforce permissions on the server. */
export function usePermission(permission: Permission): boolean {
  const { permissions } = useAuth();

  // null means "not known yet" — the session is still loading. Answering false would flash
  // every gated control out of existence and back in a moment later.
  return permissions === null ? false : permissions.includes(permission);
}

/** Returns several permission checks and the raw permission set. */
export function usePermissions() {
  const { permissions } = useAuth();

  const held = useMemo(
    () => (permissions === null ? null : toPermissions(permissions)),
    [permissions],
  );

  const has = useCallback(
    (permission: Permission) => (held === null ? false : held.includes(permission)),
    [held],
  );

  /** True when the admin holds **every** one — the right test for a combined action. */
  const hasAll = useCallback(
    (...required: Permission[]) => required.every(has),
    [has],
  );

  /** True when the admin holds **any** — the right test for showing a section. */
  const hasAny = useCallback(
    (...required: Permission[]) => required.some(has),
    [has],
  );

  return {
    /** Codes this build recognises. `null` while the session is loading. */
    permissions: held,
    /** True once the session has resolved, so a caller can tell "no" from "not yet". */
    ready: held !== null,
    has,
    hasAll,
    hasAny,
  };
}
