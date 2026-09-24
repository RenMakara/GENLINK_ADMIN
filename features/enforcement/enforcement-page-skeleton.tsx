import { PageHeader } from "@/components/common";

export function EnforcementPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading enforcement">
      <PageHeader
        title="Enforcement"
        description="Review warnings, suspensions, and bans across all GenLink KH accounts."
      />
      <div className="flex flex-col gap-3">
        <div className="h-20 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-96 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
