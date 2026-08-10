"use client";

import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/auth-provider";
import { toPermissions, type Permission } from "@/types/permissions";

/**
 * Whether the signed-in admin holds a permission (ADM-038).
 *
 * <h2>⚠ This is UX, never security</h2>
 *
 * <strong>This hook does not protect anything.</strong> It decides whether to render a control,
 * not whether an action is permitted. The server decides that on every request, from the
 * caller's own granted authorities (SSOT §5.6).
 *
 * <p>The mistake it invites: gate a new destructive endpoint here, watch the button vanish for a
 * `SUPPORT` user, and ship it with no `@PreAuthorize` on the Spring side. It looks right in
 * every screenshot and is wide open — anyone can call the endpoint directly, and editing the
 * client's answer in a browser takes seconds.
 *
 * <p><strong>If you are adding a permission check here, the server-side one must already
 * exist.</strong> This is for not showing a Ban button that would answer 403.
 *
 * <h2>Reads the session, never the network</h2>
 *
 * Permissions come from `useAuth()`, which holds what `/admin/auth/me` resolved — the same list
 * the backend derived from the caller's granted authorities, so the UI cannot disagree with
 * enforcement. This hook adds no request of its own.
 *
 * @example
 * const canBan = usePermission("user:ban");
 * return canBan ? <BanButton /> : null;
 */
export function usePermission(permission: Permission): boolean {
  const { permissions } = useAuth();

  // null means "not known yet" — the session is still loading. Answering false would flash
  // every gated control out of existence and back in a moment later.
  return permissions === null ? false : permissions.includes(permission);
}

/**
 * The same question for several permissions at once, plus the raw set.
 *
 * <p>For a component that gates more than one control and would otherwise call
 * {@link usePermission} five times.
 */
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
