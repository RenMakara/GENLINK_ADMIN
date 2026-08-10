"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  /** Metric display label (e.g. "Total Users", "Pending Verification") */
  label: ReactNode;
  /** Primary metric value (number or string) */
  value: ReactNode;
  /** Target link route (e.g. "/users?status=PENDING") */
  href: string;
  /** Period-over-period percentage delta (e.g. +12.5 or -3.2) */
  delta?: number;
  /** Custom hint or comparison text (overrides delta text if provided) */
  hint?: ReactNode;
  /** Optional icon component */
  icon?: ComponentType<LucideProps>;
  /** True if the metric is an estimate (SSOT §6.2 / ADM-046 flag for DAU/MAU) */
  estimated?: boolean;
  /** Container CSS class name */
  className?: string;
}

/**
 * A single headline KPI card wrapped in a clickable doorway link (ADM-051).
 */
export function KpiCard({
  label,
  value,
  href,
  delta,
  hint,
  icon: Icon,
  estimated = false,
  className,
}: KpiCardProps) {
  const formattedValue =
    typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : value;

  const isPositiveDelta = typeof delta === "number" && delta > 0;
  const isNegativeDelta = typeof delta === "number" && delta < 0;

  return (
    <Link
      href={href}
      className="group focus-visible:outline-none"
      aria-label={`${typeof label === "string" ? label : "KPI"}: ${formattedValue}`}
    >
      <Card
        size="sm"
        className={cn(
          "transition-colors group-hover:border-accent-foreground/30 group-hover:bg-accent/30",
          "group-focus-visible:ring-ring group-focus-visible:ring-2",
          className,
        )}
      >
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
              {estimated ? (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground/80 uppercase"
                >
                  est.
                </Badge>
              ) : null}
            </div>

            <p className="text-2xl font-semibold tracking-tight tabular-nums truncate">
              {formattedValue}
            </p>

            {hint ? (
              <p className="text-xs text-muted-foreground truncate">{hint}</p>
            ) : typeof delta === "number" ? (
              <div className="flex items-center gap-1 text-xs font-medium">
                {isPositiveDelta ? (
                  <ArrowUpRight className="size-3.5 text-success shrink-0" aria-hidden />
                ) : isNegativeDelta ? (
                  <ArrowDownRight className="size-3.5 text-destructive shrink-0" aria-hidden />
                ) : null}
                <span
                  className={cn(
                    isPositiveDelta && "text-success",
                    isNegativeDelta && "text-destructive",
                    !isPositiveDelta && !isNegativeDelta && "text-muted-foreground",
                  )}
                >
                  {isPositiveDelta ? `+${delta}%` : `${delta}%`} vs last period
                </span>
              </div>
            ) : null}
          </div>

          {Icon ? (
            <Icon className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors mt-0.5" aria-hidden />
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton matching KpiCard dimensions to avoid layout reflow (AC#3).
 */
export function KpiCardSkeleton() {
  return (
    <Card size="sm" className="animate-pulse" role="status" aria-label="Loading KPI card">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex flex-col gap-2 w-full">
          <div className="bg-muted h-3.5 w-1/2 rounded" />
          <div className="bg-muted h-7 w-3/4 rounded my-0.5" />
          <div className="bg-muted h-3 w-1/3 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
