"use client";

import { BarChart3, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChartCardProps {
  /** Main chart title */
  title: ReactNode;
  /** Subtitle or descriptive text */
  description?: ReactNode;
  /** Optional action element in the top right (e.g. date selector, export button) */
  action?: ReactNode;
  /** The chart component itself */
  children?: ReactNode;
  /** True while data is loading — renders full skeleton shell */
  loading?: boolean;
  /** Error object or error message if data fetch failed */
  error?: boolean | string | Error | null;
  /** True when dataset is empty — renders empty state placeholder */
  empty?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Container CSS class name */
  className?: string;
  /** Minimum container height for chart content area (default: 300px) */
  minHeight?: number | string;
}

/**
 * Reusable wrapper shell for all dashboard and analytics charts (ADM-050).
 *
 * <p>Provides standardized title, description, actions header, loading skeleton, error fallback,
 * and empty state handling so no chart renders a broken SVG or blank container.
 */
export function ChartCard({
  title,
  description,
  action,
  children,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = "No data available for the selected period",
  className,
  minHeight = 300,
}: ChartCardProps) {
  const heightStyle = typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <Card className={cn("flex flex-col justify-between", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>

      <CardContent className="flex-1 pb-6">
        {loading ? (
          <div
            style={{ height: heightStyle }}
            className="bg-muted/30 flex w-full flex-col justify-between rounded-md p-4 animate-pulse"
            aria-label="Loading chart data"
            role="status"
          >
            <div className="flex items-end justify-between gap-2 h-full pt-4">
              <div className="bg-muted h-3/5 w-full rounded" />
              <div className="bg-muted h-4/5 w-full rounded" />
              <div className="bg-muted h-2/5 w-full rounded" />
              <div className="bg-muted h-full w-full rounded" />
              <div className="bg-muted h-3/4 w-full rounded" />
              <div className="bg-muted h-1/2 w-full rounded" />
            </div>
            <div className="bg-muted mt-4 h-4 w-full rounded" />
          </div>
        ) : error ? (
          <div
            style={{ minHeight: heightStyle }}
            className="flex items-center justify-center p-4"
          >
            <Alert variant="destructive" className="max-w-md">
              <ShieldAlert className="size-4" />
              <AlertTitle>Failed to load chart data</AlertTitle>
              <AlertDescription className="text-xs">
                {typeof error === "string"
                  ? error
                  : error instanceof Error
                  ? error.message
                  : "An unexpected error occurred while fetching chart metrics."}
              </AlertDescription>
            </Alert>
          </div>
        ) : empty ? (
          <div
            style={{ minHeight: heightStyle }}
            className="border-border/50 text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center"
          >
            <BarChart3 className="size-8 stroke-1 text-muted-foreground/60" aria-hidden />
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <div style={{ minHeight: heightStyle }} className="w-full">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
