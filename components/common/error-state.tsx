import type { ReactNode } from "react";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Error state with a message and optional retry or recovery action. */
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
