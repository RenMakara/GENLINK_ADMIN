import { PageHeader } from "@/components/common";

export function RoleEditorPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading role permissions">
      <PageHeader
        title="Role editor"
        description="Review and manage the permissions assigned to this administrator role."
      />
      <div className="h-28 w-full animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
