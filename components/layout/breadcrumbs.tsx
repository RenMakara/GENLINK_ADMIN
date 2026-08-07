"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { shippedItems } from "@/config/navigation";

/** Segments that are route-group or id noise rather than something to show. */
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Breadcrumbs derived from App Router segments (SSOT §3).
 *
 * <p>Derived rather than declared: a hand-maintained trail per page drifts the moment someone
 * adds a route, and drifts silently.
 *
 * <p>A segment's label comes from the navigation map where one matches, so the crumb reads
 * "Roles & Permissions" rather than "roles". Anything unmatched is title-cased, and an id-looking
 * segment renders as a short hash — a full UUID in a breadcrumb is unreadable and pushes the
 * useful part off screen. ADM-045 onwards can replace those with real names once the pages know
 * what they are showing.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const labelFor = (segment: string, href: string): string => {
    const item = shippedItems().find((candidate) => candidate.href === href);
    if (item) {
      return item.label;
    }
    if (UUID_LIKE.test(segment)) {
      return segment.slice(0, 8);
    }
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return { href, label: labelFor(segment, href), last: index === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {crumb.last ? (
              // The current page is not a link, and carries aria-current so it is announced
              // as the destination rather than another place to go.
              <span aria-current="page" className="truncate font-medium">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground truncate transition-colors"
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="text-muted-foreground/60 size-3.5 shrink-0" aria-hidden />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
