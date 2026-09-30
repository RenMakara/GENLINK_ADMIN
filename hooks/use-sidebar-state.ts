"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "genlink-admin.sidebar.collapsed";

/** Persists sidebar state with hydration-safe rendering and cross-tab sync. */

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
