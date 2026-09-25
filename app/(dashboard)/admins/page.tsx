import { Suspense } from "react";

import { AdminsPage } from "@/features/admins/admins-page";
import { AdminsPageSkeleton } from "@/features/admins/admins-page-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<AdminsPageSkeleton />}>
      <AdminsPage />
    </Suspense>
  );
}
