import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The "nothing here" panel (ADM-040, AC#3).
 *
 * <p>An empty list is ambiguous — did the query fail, is the filter too narrow, or is there
 * genuinely nothing? This says which, and gives a way forward: the `action` slot (AC#3) carries
 * a "Clear filters" or "Add the first one" control, so an empty screen is never a dead end.
 *
 * <p>Distinct from {@link ErrorState} on purpose. This is an expected, calm absence; that is a
 * failure. Rendering them the same way trains operators to ignore both.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<LucideProps>;
  title: ReactNode;
  description?: ReactNode;
  /** AC#3: the way out — "Clear filters", "Invite a user". */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
