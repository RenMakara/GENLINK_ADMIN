import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PrimitivesShowcase } from "./primitives-showcase";

/**
 * Placeholder home page, doubling as the theme proof for ADM-013.
 *
 * <p>Renders one of each shadcn primitive so that toggling light/dark visibly exercises the
 * token set rather than asserting it in the abstract.
 *
 * <p>Moved under the app shell by ADM-034 and off the root route, which now lands on the
 * dashboard. Kept rather than deleted: it is the fastest way to eyeball both themes after a
 * token change, and it is deliberately absent from the sidebar because it is a developer tool,
 * not a page an administrator has any use for.
 */
export default function Home() {
  const t = useTranslations("App");

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("name")}</h1>
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Design tokens</CardTitle>
          <CardDescription>
            Every primitive below reads the same CSS variables, so switching theme moves all
            of them together.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          {/*
            Status colours are semantic (SSOT §11.2), and every badge carries text as well as
            colour — roughly 1 in 12 men has a colour-vision deficiency, and the person banning
            accounts may be one of them.
          */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-success text-success-foreground">Active</Badge>
            <Badge className="bg-warning text-warning-foreground">Suspended</Badge>
            <Badge variant="destructive">Banned</Badge>
            <Badge variant="secondary">Pending</Badge>
            <Badge variant="outline">Deleted</Badge>
          </div>

          <Input placeholder="Search users…" aria-label="Search users" />

          {/* Tabular numerals: digits line up so a column of figures can be scanned. */}
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-1">Total users</td>
                <td className="py-1 text-right">1,284</td>
              </tr>
              <tr>
                <td className="py-1">Pending verification</td>
                <td className="py-1 text-right">117</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PrimitivesShowcase />
    </div>
  );
}
