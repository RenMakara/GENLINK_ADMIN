import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Headline metric with an optional caller-formatted hint. */
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
