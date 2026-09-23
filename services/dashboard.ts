import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/services/query-keys";
import type { DashboardChartsPayload, KpiSummaryData, RecentActivityData, SystemHealthData } from "@/components/dashboard";

export interface DashboardSummaryResponse {
  summary?: KpiSummaryData | null;
  userGrowth?: DashboardChartsPayload["userGrowth"];
  registrations?: DashboardChartsPayload["registrations"];
  activityTrends?: DashboardChartsPayload["activityTrends"];
  statusSplit?: DashboardChartsPayload["statusSplit"];
  recentAdminActions?: RecentActivityData["adminActions"];
  recentRegistrations?: RecentActivityData["registrations"];
}

/** Fetches aggregate summary for KPI cards, charts, and activity panels (ADM-045). */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => api.get<DashboardSummaryResponse>(endpoints.dashboard.summary),
  });
}

/** Fetches backend actuator and system health status (ADM-047, ADM-055). */
export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: () => api.get<SystemHealthData>(endpoints.system.health),
  });
}
