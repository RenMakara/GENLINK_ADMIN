import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Placeholder for a route whose feature is not implemented yet. */
export function PageStub({ title, task }: { title: string; task: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Not built yet</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This page is a placeholder so the navigation and breadcrumbs can be exercised. It is
          replaced by <span className="font-mono">{task}</span>.
        </CardContent>
      </Card>
    </div>
  );
}
