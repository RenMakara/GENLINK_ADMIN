import {
  DashboardCharts,
  KpiCardRow,
  QuickActionsPanel,
  RecentActivityPanels,
  SystemHealthPanel,
} from "@/components/dashboard";
import { PageHeader } from "@/components/common";

/**
 * Full-page streaming skeleton loader for /dashboard (ADM-056).
 */
export default function DashboardLoading() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Loading dashboard page">
      <PageHeader
        title="Dashboard"
        description="GenLink KH Admin Portal Overview (Asia/Phnom_Penh)"
      />

      <KpiCardRow loading />

      <DashboardCharts loading />

      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActionsPanel loading />
        <SystemHealthPanel loading />
      </div>

      <RecentActivityPanels loading />
    </div>
  );
}
