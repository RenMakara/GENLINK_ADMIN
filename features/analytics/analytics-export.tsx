"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { ConfirmDialog } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permission";
import type { DownloadResult } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/date";
import { exportAnalyticsCsv } from "@/services/analytics";

import type { AnalyticsDashboardId, AnalyticsQuery } from "./analytics-state";

export interface AnalyticsExportButtonProps {
  series: AnalyticsDashboardId;
  title: string;
  query: AnalyticsQuery | null;
  estimated?: boolean;
}

function formatDateLabel(value: string): string {
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

export function analyticsExportSummary(title: string, query: AnalyticsQuery): string[] {
  return [
    `Series: ${title}`,
    `Range: ${formatDateLabel(query.from)} to ${formatDateLabel(query.to)}`,
    `Grouping: ${query.granularity}`,
  ];
}

function exportErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.rawCode ?? error.code) {
    case "FORBIDDEN":
      return "You do not have permission to export analytics.";
    case "VALIDATION_ERROR":
      return "Check the selected range and provide a reason with at least 10 characters.";
    case "RATE_LIMITED":
      return "Too many export requests were made. Wait a moment and try again.";
    case "ADMIN_SUDO_REQUIRED":
      return "Additional verification is required before this export.";
    default:
      return null;
  }
}

function triggerBrowserDownload(result: DownloadResult): void {
  if (typeof document === "undefined") return;
  if (typeof URL.createObjectURL !== "function") {
    throw new Error("Browser downloads are not supported in this environment");
  }

  const objectUrl = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = result.filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function AnalyticsExportDialog({
  open,
  onOpenChange,
  series,
  title,
  query,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: AnalyticsDashboardId;
  title: string;
  query: AnalyticsQuery;
}) {
  const summary = analyticsExportSummary(title, query);

  const confirmExport = async (reason: string) => {
    const result = await exportAnalyticsCsv({ ...query, series, reason });
    triggerBrowserDownload(result);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Export ${title}?`}
      description="The server will record this analytics export in the admin audit trail."
      consequence={
        <div className="space-y-2">
          <p>This CSV will contain the exact series and range currently shown on screen.</p>
          <ul className="list-disc space-y-1 pl-5">
            {summary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      }
      confirmLabel="Download CSV"
      errorMessageFor={exportErrorMessage}
      onConfirm={confirmExport}
    />
  );
}

/** Permission-gated export action shared by every analytics chart card. */
export function AnalyticsExportButton({
  series,
  title,
  query,
  estimated = false,
}: AnalyticsExportButtonProps) {
  const { has, ready } = usePermissions();
  const [open, setOpen] = useState(false);
  const canExport = ready && has("analytics:export");

  if (!canExport) {
    return estimated ? <Badge variant="secondary">Estimated</Badge> : null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {estimated ? <Badge variant="secondary">Estimated</Badge> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Export ${title} CSV`}
          title={query ? `Export ${title} for the selected range` : "Choose a valid range first"}
          disabled={!query}
          onClick={() => setOpen(true)}
        >
          <Download aria-hidden="true" />
          Export
        </Button>
      </div>
      {query ? (
        <AnalyticsExportDialog
          open={open}
          onOpenChange={setOpen}
          series={series}
          title={title}
          query={query}
        />
      ) : null}
    </>
  );
}
