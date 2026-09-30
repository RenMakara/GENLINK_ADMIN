"use client";

import { useState } from "react";
import { UsersIcon, InboxIcon } from "lucide-react";

import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { USER_STATUSES } from "@/lib/ui/status";
import type { ConfirmTier } from "@/lib/ui/confirm";

/** Developer-only gallery for previewing shared UI primitives. */
export function PrimitivesShowcase() {
  const [tier, setTier] = useState<ConfirmTier | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared primitives (ADM-040)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <PageHeader
          title="Page header"
          description="One h1 per page, with a slot for primary actions."
          actions={<Button size="sm">Primary action</Button>}
        />

        <div className="flex flex-wrap gap-2" data-testid="status-badges">
          {USER_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          <StatusBadge status="ARCHIVED" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total users" value="1,284" hint="+42 this week" icon={UsersIcon} />
          <StatCard label="Pending" value="117" />
          <StatCard label="Banned" value="9" />
        </div>

        <EmptyState
          icon={InboxIcon}
          title="No users match these filters"
          description="Try widening the date range or clearing the status filter."
          action={<Button variant="outline" size="sm">Clear filters</Button>}
        />

        <ErrorState
          description="The user list could not be loaded."
          onRetry={() => undefined}
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setTier("low")}>
            Confirm: low
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTier("medium")}>
            Confirm: medium
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTier("high")}>
            Confirm: high
          </Button>
        </div>

        <ConfirmDialog
          open={tier !== null}
          onOpenChange={(o) => setTier(o ? tier : null)}
          tier={tier ?? "low"}
          title="Ban this user?"
          description="They will lose access immediately."
          consequence="This prevents the account from signing in while keeping the account and its content."
          confirmLabel="Ban user"
          confirmTarget="sok.dara@genlink.kh"
          confirmTargetLabel="email"
          onConfirm={() => setTier(null)}
        />
      </CardContent>
    </Card>
  );
}
