import { PageHeader } from "@/components/common";

export function UserDetailPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading user details">
      <PageHeader title="User details" description="Loading the selected GenLink KH account." />
      <div className="bg-card flex flex-col gap-5 rounded-xl p-6 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="size-16 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="flex min-w-48 flex-1 flex-col gap-2">
            <div className="h-5 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </div>
          <div className="h-10 w-16 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        </div>
        <div className="h-10 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
