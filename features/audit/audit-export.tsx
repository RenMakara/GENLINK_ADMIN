"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { ConfirmDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { DownloadResult } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { exportAuditLogsCsv, buildAuditLogExportRequest } from "@/services/audit-logs";

import type { AuditLogFilters } from "./audit-types";

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

export function auditExportSummary(filters: AuditLogFilters): string[] {
  return [
    `Admin: ${filters.adminId.trim() || "All administrators"}`,
    `Action: ${filters.action.trim() || "All actions"}`,
    `Target type: ${filters.targetType.trim() || "All target types"}`,
    `Date range: ${filters.from || "Any"} to ${filters.to || "Any"} (Phnom Penh)`,
    `Status: ${filters.status || "All statuses"}`,
  ];
}

function exportErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.rawCode ?? error.code) {
    case "FORBIDDEN":
      return "Only a Super Admin can export audit logs.";
    case "VALIDATION_ERROR":
      return "Check the selected filters and provide a reason with at least 10 characters.";
    case "EXPORT_TOO_LARGE":
      return "The result is too large to export. Narrow the filters and try again.";
    case "ADMIN_SUDO_REQUIRED":
      return "Additional verification is required before this export.";
    default:
      return null;
  }
}

export function AuditExportButton({ filters }: { filters: AuditLogFilters }) {
  const [open, setOpen] = useState(false);

  const confirmExport = async (reason: string) => {
    const result = await exportAuditLogsCsv(buildAuditLogExportRequest(filters, reason));
    triggerBrowserDownload(result);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download aria-hidden="true" />
        Export CSV
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tier="medium"
        title="Export audit logs?"
        description="The server will record this export in the append-only admin audit trail."
        consequence={
          <div className="space-y-2">
            <p>The CSV will contain the complete result matching these filters:</p>
            <ul className="list-disc space-y-1 pl-5">
              {auditExportSummary(filters).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        }
        confirmLabel="Download CSV"
        errorMessageFor={exportErrorMessage}
        onConfirm={confirmExport}
      />
    </>
  );
}

