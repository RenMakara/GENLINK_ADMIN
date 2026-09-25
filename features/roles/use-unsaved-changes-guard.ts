"use client";

import { useCallback, useEffect, useRef } from "react";

export const UNSAVED_CHANGES_MESSAGE =
  "You have unsaved permission changes. Leave without saving?";

type Navigation = () => void;

/**
 * Protects the permission editor from accidental document and in-app link navigation.
 *
 * <p>The browser's beforeunload prompt covers refresh, close, and external navigation. The
 * capture-phase link listener covers Next.js `<Link>` navigation before the router consumes the
 * click. Feature buttons should use the returned {@link confirmNavigation} callback because
 * programmatic router navigation does not produce an anchor click.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const dirtyRef = useRef(isDirty);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  const confirmNavigation = useCallback((navigate: Navigation) => {
    if (!dirtyRef.current || window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      navigate();
    }
  }, []);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = UNSAVED_CHANGES_MESSAGE;
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) {
        return;
      }

      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  return { confirmNavigation };
}
