import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  analyticsQueryKey,
  type AnalyticsDashboardId,
  type AnalyticsQuery,
} from "@/features/analytics/analytics-state";
import type { AnalyticsDataById } from "@/features/analytics/analytics-types";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

import { queryKeys } from "./query-keys";

const ANALYTICS_ENDPOINTS: Record<AnalyticsDashboardId, string> = {
  "user-growth": endpoints.analytics.userGrowth,
  "active-users": endpoints.analytics.activeUsers,
  registrations: endpoints.analytics.registrations,
  "user-status": endpoints.analytics.userStatus,
  universities: endpoints.analytics.universities,
  "work-status": endpoints.analytics.workStatus,
  languages: endpoints.analytics.languages,
  "xp-distribution": endpoints.analytics.xpDistribution,
  platforms: endpoints.analytics.platforms,
};

export function analyticsQueryParams(query: AnalyticsQuery) {
  return {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
  };
}

/** Fetches one ADM-118 series using the shared URL-owned date and granularity state. */
export function useAnalyticsDashboard<Dashboard extends AnalyticsDashboardId>(
  dashboard: Dashboard,
  query: AnalyticsQuery | null,
  enabled = true,
): UseQueryResult<AnalyticsDataById[Dashboard]> {
  return useQuery<AnalyticsDataById[Dashboard]>({
    queryKey: queryKeys.analytics.series(dashboard, query),
    queryFn: ({ signal }) =>
      api.get<AnalyticsDataById[Dashboard]>(ANALYTICS_ENDPOINTS[dashboard], {
        query: analyticsQueryParams(query as AnalyticsQuery),
        signal,
      }),
    enabled: enabled && query !== null,
    staleTime: 5 * 60 * 1000,
  });
}

/** Exposed for focused contract tests without requiring a React Query provider. */
export function analyticsEndpoint(dashboard: AnalyticsDashboardId): string {
  return ANALYTICS_ENDPOINTS[dashboard];
}

/** Keeps this module's canonical key contract visible to service tests and callers. */
export { analyticsQueryKey };
