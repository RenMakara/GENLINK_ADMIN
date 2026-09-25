"use client";

import Link from "next/link";

import { ErrorState, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api/errors";
import { formatPrecise } from "@/lib/utils/date";
import { useAuditLogDetail } from "@/services/audit-logs";

import { AuditDiff } from "./audit-diff";
import type { AuditLogDetail } from "./audit-types";

function detailError(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view this audit record.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "This audit record is no longer available.";
  }
  return "We could not load this audit record right now. Please try again.";
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{children || "—"}</dd>
    </div>
  );
}

function TargetLink({ detail }: { detail: AuditLogDetail }) {
  if (!detail.targetId) return <span>{detail.targetType || "No target"}</span>;
  if (detail.targetType?.toUpperCase() === "USER") {
    return (
      <Link
        href={`/users/${encodeURIComponent(detail.targetId)}`}
        className="text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {detail.targetType} · {detail.targetId}
      </Link>
    );
  }
  return <span>{detail.targetType || "Target"} · {detail.targetId}</span>;
}

function DetailContent({ detail }: { detail: AuditLogDetail }) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField label="When">
          <time dateTime={detail.createdAt} title={formatPrecise(detail.createdAt)}>
            {formatPrecise(detail.createdAt)}
          </time>
        </DetailField>
        <DetailField label="Status">
          <StatusBadge status={detail.status} />
        </DetailField>
        <DetailField label="Action"><Badge variant="outline">{detail.action}</Badge></DetailField>
        <DetailField label="Target"><TargetLink detail={detail} /></DetailField>
        <DetailField label="Admin">
          <span>{detail.adminName || "System"}</span>
          {detail.adminEmail ? <span className="block text-xs text-muted-foreground">{detail.adminEmail}</span> : null}
        </DetailField>
        <DetailField label="Reason">{detail.reason}</DetailField>
        {detail.errorCode ? <DetailField label="Error code"><code>{detail.errorCode}</code></DetailField> : null}
        {detail.requestId ? <DetailField label="Request ID"><code>{detail.requestId}</code></DetailField> : null}
        {detail.batchId ? <DetailField label="Batch ID"><code>{detail.batchId}</code></DetailField> : null}
        {detail.ipAddress ? <DetailField label="IP address"><code>{detail.ipAddress}</code></DetailField> : null}
        {detail.userAgent ? <DetailField label="User agent">{detail.userAgent}</DetailField> : null}
      </dl>

      <section aria-labelledby="audit-diff-title" className="flex flex-col gap-3">
        <div>
          <h3 id="audit-diff-title" className="text-sm font-medium">Before / after changes</h3>
          <p className="mt-1 text-xs text-muted-foreground">Changed fields are listed individually; unchanged fields are omitted.</p>
        </div>
        <AuditDiff before={detail.beforeJson} after={detail.afterJson} />
      </section>
    </div>
  );
}

export function AuditDetailSheet({
  auditLogId,
  onOpenChange,
}: {
  auditLogId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const query = useAuditLogDetail(auditLogId, Boolean(auditLogId));

  return (
    <Sheet open={Boolean(auditLogId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>Audit log detail</SheetTitle>
          <SheetDescription>
            Read-only record from the append-only administrative audit trail.
          </SheetDescription>
        </SheetHeader>
        {query.isLoading ? (
          <div className="flex items-center px-4 py-8 text-sm text-muted-foreground" role="status">
            Loading audit record…
          </div>
        ) : query.isError ? (
          <ErrorState description={detailError(query.error)} onRetry={() => void query.refetch()} className="mx-4" />
        ) : query.data ? (
          <DetailContent detail={query.data} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

