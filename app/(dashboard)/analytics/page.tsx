import { Suspense } from "react";

import { AnalyticsPage } from "@/features/analytics/analytics-page";

function AnalyticsPageFallback() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      Loading analytics…
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AnalyticsPageFallback />}>
      <AnalyticsPage />
    </Suspense>
  );
}
