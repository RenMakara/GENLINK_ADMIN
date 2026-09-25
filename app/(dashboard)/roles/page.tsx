import { Suspense } from "react";

import { RolesPage } from "@/features/roles/roles-page";
import { RolesPageSkeleton } from "@/features/roles/roles-page-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<RolesPageSkeleton />}>
      <RolesPage />
    </Suspense>
  );
}
