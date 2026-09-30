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
import { ChartsShowcase } from "./charts-showcase";
import { PrimitivesShowcase } from "./primitives-showcase";

/** Developer-only showcase for checking shared design tokens and themes. */
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

          {/* Statuses use text labels as well as color. */}
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

      <ChartsShowcase />
    </div>
  );
}
