import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholder for a route the shell links to but whose feature has not been built.
 *
 * <p>These exist so the navigation is walkable and breadcrumbs resolve while the shell is being
 * reviewed (ADM-034). Each says which task replaces it, so a stub cannot be mistaken for a
 * finished page that happens to be empty.
 */
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
