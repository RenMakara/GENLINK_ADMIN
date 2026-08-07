"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "genlink-admin.sidebar.collapsed";

/**
 * Sidebar collapsed state, persisted across reloads (SSOT §3, ADM-034 AC#2).
 *
 * <h2>Why `useSyncExternalStore` and not `useState` + `useEffect`</h2>
 *
 * `localStorage` is an external store whose value differs between server and client, which is
 * exactly what this hook is for. The obvious alternative — read it in an effect and `setState` —
 * causes a cascading render, which `react-hooks/set-state-in-effect` rejects, and it does so for
 * good reason: React cannot batch the correction with the initial paint.
 *
 * <p>Reading during render is not an option either. The server has no `localStorage`, so the
 * markup would disagree with the first client render and React would report a hydration
 * mismatch — the same class of bug as rendering a relative timestamp.
 *
 * <p>`getServerSnapshot` therefore answers "expanded" for both the server and the hydrating
 * client, and React swaps in the real value immediately afterwards.
 *
 * <h2>Why `animate` lags a frame behind</h2>
 *
 * That correction must not be animated, or a stored-collapsed sidebar visibly slides shut on
 * every page load. Gating on "have we hydrated" does not achieve it: the hydration flag and the
 * corrected width land in the same render, so the transition is already in place when the width
 * changes. It has to be enabled one frame *later*, which is what the `requestAnimationFrame`
 * below does - the correction snaps, and every toggle after it animates.
 *
 * <p>Subscribing also brings cross-tab sync, which the effect version did not have: collapsing
 * the sidebar in one tab now updates the others, because `storage` fires in every other
 * document sharing the origin.
 */

const listeners = new Set<() => void>();
let storageListenerAttached = false;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!storageListenerAttached) {
    // Attached once for the whole module, not per subscriber - otherwise the first component
    // to unmount would remove the listener the others still depend on.
    window.addEventListener("storage", emit);
    storageListenerAttached = true;
  }
  return () => {
    listeners.delete(listener);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Private browsing and hardened enterprise profiles can throw on access. A sidebar that
    // forgets its state is a far smaller problem than a shell that fails to render.
    return false;
  }
}

/** Expanded on the server and during hydration - see the note above. */
function serverCollapsed(): boolean {
  return false;
}

export function useSidebarState() {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, serverCollapsed);

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    // Scheduled, not called directly in the effect body: the correction render must have
    // painted before transitions are armed, and a synchronous setState here would land in the
    // same commit as the width change - which is the bug this exists to avoid.
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(!readCollapsed()));
    } catch {
      // The toggle still works for this session; only persistence is lost.
    }
    // `storage` does not fire in the tab that wrote it, so this tab is notified explicitly.
    emit();
  }, []);

  return { collapsed, toggle, animate };
}

/** Exported for tests, so the key cannot drift from what the hook actually writes. */
export const SIDEBAR_STORAGE_KEY = STORAGE_KEY;
