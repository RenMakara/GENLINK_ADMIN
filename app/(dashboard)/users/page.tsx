import { Suspense } from "react";

import { UsersPage } from "@/features/users/users-page";
import { UsersPageSkeleton } from "@/features/users/users-page-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersPage />
    </Suspense>
  );
}
