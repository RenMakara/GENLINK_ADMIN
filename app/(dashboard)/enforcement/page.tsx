import { Suspense } from "react";

import { EnforcementPage } from "@/features/enforcement/enforcement-page";
import { EnforcementPageSkeleton } from "@/features/enforcement/enforcement-page-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<EnforcementPageSkeleton />}>
      <EnforcementPage />
    </Suspense>
  );
}
