import { PageHeader } from "@/components/common";

export function RolesPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading roles">
      <PageHeader
        title="Roles & Permissions"
        description="Review staff roles and the administrators assigned to them."
      />
      <div className="h-96 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
    </div>
  );
}
