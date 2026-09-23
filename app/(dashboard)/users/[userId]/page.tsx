import { Suspense } from "react";

import { UserDetailPage } from "@/features/users/user-detail-page";
import { UserDetailPageSkeleton } from "@/features/users/user-detail-page-skeleton";

export default async function Page({ params }: PageProps<"/users/[userId]">) {
  const { userId } = await params;

  return (
    <Suspense fallback={<UserDetailPageSkeleton />}>
      <UserDetailPage userId={userId} />
    </Suspense>
  );
}
