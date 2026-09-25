"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { BarChart3, CalendarRange, Info } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { displayTimeZone, toCalendarDate } from "@/lib/utils/date";

import {
  ANALYTICS_GRANULARITIES,
  ANALYTICS_RANGE_PRESETS,
  ANALYTICS_TABS,
  analyticsQuery,
  analyticsQueryKey,
  dashboardsForTab,
  parseAnalyticsState,
  presetAnalyticsRange,
  serializeAnalyticsState,
  type AnalyticsGranularity,
  type AnalyticsRangePreset,
  type AnalyticsState,
  type AnalyticsTab,
} from "./analytics-state";

const RANGE_LABELS: Record<AnalyticsRangePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  custom: "Custom range",
};

const GRANULARITY_LABELS: Record<AnalyticsGranularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

function selectClassName() {
  return "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 motion-reduce:transition-none";
}

function tabLabel(tab: AnalyticsTab): string {
  return ANALYTICS_TABS.find((candidate) => candidate.value === tab)?.label ?? "Overview";
}

function AnalyticsDashboardSlot({
  dashboard,
  query,
}: {
  dashboard: ReturnType<typeof dashboardsForTab>[number];
  query: ReturnType<typeof analyticsQuery>;
}) {
  const refreshKey = query
    ? analyticsQueryKey(dashboard.id, query).join(":")
    : `${dashboard.id}:invalid-range`;

  return (
    <div
      key={refreshKey}
      className="flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4"
      data-analytics-dashboard={dashboard.id}
      data-analytics-query-key={refreshKey}
    >
      <div className="flex items-start gap-3">
        <BarChart3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-medium">{dashboard.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualization will use the selected Phnom Penh date range and granularity.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Dashboard visualization scheduled for ADM-118.</p>
    </div>
  );
}

export function AnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const [referenceNow] = useState(() => new Date());
  const today = toCalendarDate(referenceNow);
  const tabRefs = useRef<Partial<Record<AnalyticsTab, HTMLButtonElement | null>>>({});

  const state = useMemo(
    () => parseAnalyticsState(new URLSearchParams(serializedSearchParams), referenceNow),
    [referenceNow, serializedSearchParams],
  );
  const query = analyticsQuery(state);
  const dashboards = dashboardsForTab(state.tab);

  const updateState = useCallback(
    (patch: Partial<AnalyticsState>) => {
      const nextState: AnalyticsState = {
        range: state.range,
        from: state.from,
        to: state.to,
        granularity: state.granularity,
        tab: state.tab,
        ...patch,
      };
      const nextSearch = serializeAnalyticsState(nextState, serializedSearchParams);
      if (nextSearch === serializedSearchParams) return;

      router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
    },
    [pathname, router, serializedSearchParams, state],
  );

  const handleRangeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const range = event.target.value as AnalyticsRangePreset;
    if (range === "custom") {
      updateState({ range, from: state.from, to: state.to });
      return;
    }

    updateState({ range, ...presetAnalyticsRange(range, today) });
  };

  const handleGranularityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateState({ granularity: event.target.value as AnalyticsGranularity });
  };

  const handleCustomDateChange = (field: "from" | "to") => (event: ChangeEvent<HTMLInputElement>) => {
    updateState({ range: "custom", [field]: event.target.value });
  };

  const moveToTab = (index: number) => {
    const nextTab = ANALYTICS_TABS[(index + ANALYTICS_TABS.length) % ANALYTICS_TABS.length];
    updateState({ tab: nextTab.value });
    tabRefs.current[nextTab.value]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveToTab(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveToTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveToTab(0);
        break;
      case "End":
        event.preventDefault();
        moveToTab(ANALYTICS_TABS.length - 1);
        break;
    }
  };

  const activePanelId = "analytics-tabpanel";
  const rangeError = state.range === "custom" ? state.customRangeError : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sr-only" aria-live="polite" role="status">
        Analytics range {state.from} to {state.to}, grouped {GRANULARITY_LABELS[state.granularity].toLowerCase()}.
      </div>

      <PageHeader
        title="Analytics"
        description="Explore GenLink KH trends by Phnom Penh calendar date."
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <CalendarRange className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>Date range and grouping</CardTitle>
              <CardDescription>
                These controls are URL-synced and will be shared by every visible analytics chart.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="analytics-range" className="text-sm font-medium">
                Date range
              </label>
              <select
                id="analytics-range"
                aria-describedby={rangeError ? "analytics-range-error" : undefined}
                className={selectClassName()}
                value={state.range}
                onChange={handleRangeChange}
              >
                {ANALYTICS_RANGE_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {RANGE_LABELS[preset]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="analytics-granularity" className="text-sm font-medium">
                Granularity
              </label>
              <select
                id="analytics-granularity"
                className={selectClassName()}
                value={state.granularity}
                onChange={handleGranularityChange}
              >
                {ANALYTICS_GRANULARITIES.map((granularity) => (
                  <option key={granularity} value={granularity}>
                    {GRANULARITY_LABELS[granularity]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <p className="flex min-h-9 items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" aria-hidden="true" />
                Timezone: {displayTimeZone}
              </p>
            </div>
          </div>

          {state.range === "custom" ? (
            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="analytics-from" className="text-sm font-medium">
                  From
                </label>
                <Input
                  id="analytics-from"
                  type="date"
                  value={state.from}
                  max={state.to || undefined}
                  aria-invalid={Boolean(rangeError)}
                  aria-describedby={rangeError ? "analytics-range-error" : undefined}
                  onChange={handleCustomDateChange("from")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="analytics-to" className="text-sm font-medium">
                  To
                </label>
                <Input
                  id="analytics-to"
                  type="date"
                  value={state.to}
                  min={state.from || undefined}
                  aria-invalid={Boolean(rangeError)}
                  aria-describedby={rangeError ? "analytics-range-error" : undefined}
                  onChange={handleCustomDateChange("to")}
                />
              </div>
              {rangeError ? (
                <p id="analytics-range-error" className="text-sm text-destructive sm:col-span-2" role="alert">
                  {rangeError}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Request range: <span className="font-medium text-foreground">{state.from}</span> to{" "}
            <span className="font-medium text-foreground">{state.to}</span> ({displayTimeZone}).
          </p>
        </CardContent>
      </Card>

      {rangeError ? (
        <Alert variant="destructive">
          <Info aria-hidden="true" />
          <AlertTitle>Choose a valid analytics range</AlertTitle>
          <AlertDescription>{rangeError} Charts remain paused until the range is valid.</AlertDescription>
        </Alert>
      ) : null}

      <section aria-label="Analytics dashboards" className="flex min-w-0 flex-col gap-4">
        <div
          role="tablist"
          aria-label="Analytics dashboard groups"
          aria-orientation="horizontal"
          className="min-w-0 overflow-x-auto border-b border-border"
        >
          <div className="flex min-w-max gap-1" role="presentation">
            {ANALYTICS_TABS.map((tab, index) => {
              const selected = tab.value === state.tab;
              return (
                <button
                  key={tab.value}
                  ref={(element) => {
                    tabRefs.current[tab.value] = element;
                  }}
                  id={`analytics-tab-${tab.value}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={activePanelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => updateState({ tab: tab.value })}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`relative min-h-10 whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${selected ? "bg-muted text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-primary" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={`analytics-tab-${state.tab}`}
          tabIndex={0}
          className="min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{tabLabel(state.tab)}</CardTitle>
                  <CardDescription>
                    Visible charts will use the selected range and refetch when it changes.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {RANGE_LABELS[state.range]} · {GRANULARITY_LABELS[state.granularity]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
              {dashboards.map((dashboard) => (
                <AnalyticsDashboardSlot key={dashboard.id} dashboard={dashboard} query={query} />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Analytics values are scoped to the permissions of your current admin session. Active-user
        metrics will be labelled as estimates when the visualisations are added.
      </p>
    </div>
  );
}
