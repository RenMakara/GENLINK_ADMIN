import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The title block at the top of a page (ADM-040).
 *
 * <p>A single `<h1>` per page lives here, so every feature page shares the same heading rhythm
 * and a screen-reader user gets one predictable landmark rather than each page inventing its
 * own. `actions` is the right-hand slot for the page's primary buttons — "Export", "New role" —
 * which is why it sits on the header and not inside each page's body, where it would drift out
 * of alignment.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Primary controls for the page, aligned to the right of the title. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
