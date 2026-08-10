import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A single headline figure (ADM-040) — "1,284 users", "117 pending".
 *
 * <p>The value is `tabular-nums` so a row of these lines up digit-for-digit and can be scanned,
 * and it is a plain string or number rather than pre-formatted markup: locale and thousands
 * separators are a caller concern (SSOT §9.5 keeps date/number formatting in one place), so this
 * does not reach for a formatter of its own.
 *
 * <p>`hint` carries a period-over-period delta or a note. It is styled but not coloured
 * green/red here — "up 12%" is good for signups and bad for churn, and the component cannot know
 * which, so the caller passes an already-decided node.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<LucideProps>;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : null}
      </CardContent>
    </Card>
  );
}
