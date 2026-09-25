import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Stable loading geometry for the ADM-109 staff directory. */
export function AdminsPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Loading Admin users">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-56 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
