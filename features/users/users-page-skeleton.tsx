import { PageHeader } from "@/components/common";

export function UsersPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading users">
      <PageHeader title="Users" description="Search, filter, and inspect GenLink KH accounts." />
      <div className="flex flex-col gap-3">
        <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-96 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
