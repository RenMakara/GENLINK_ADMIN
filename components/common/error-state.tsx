import type { ReactNode } from "react";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The "this failed" panel (ADM-040, AC#3).
 *
 * <p>Deliberately not an {@link EmptyState}: a failure and an absence are different facts, and an
 * operator who cannot tell them apart will either retry a genuinely empty list forever or shrug
 * off a real outage. This one carries an alarm colour and, crucially, a retry (AC#3) — a
 * transient API error should cost a click, not a page reload.
 *
 * <p>`onRetry` is the common case and gets a button built in; `action` is the escape hatch for a
 * page that needs something other than a plain retry. Passing neither is allowed — some errors
 * genuinely have no client-side remedy — but a message is always shown.
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  /** AC#3: the retry. Rendered as a button unless `action` overrides it. */
  onRetry?: () => void;
  /** A custom control, when a plain retry is not the right remedy. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertTriangleIcon className="size-6 text-destructive" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ?? (onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      ) : null)}
    </div>
  );
}
