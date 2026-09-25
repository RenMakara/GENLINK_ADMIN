import { Suspense } from "react";

import { RoleEditorPage } from "@/features/roles/role-editor-page";
import { RoleEditorPageSkeleton } from "@/features/roles/role-editor-page-skeleton";

export default async function Page({ params }: PageProps<"/roles/[roleId]">) {
  const { roleId } = await params;

  return (
    <Suspense fallback={<RoleEditorPageSkeleton />}>
      <RoleEditorPage roleId={roleId} />
    </Suspense>
  );
}
