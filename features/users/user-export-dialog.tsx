"use client";

import type { ReactNode } from "react";
import { ConfirmDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import type { DownloadResult } from "@/lib/api/client";
import { exportUsersCsv, type UserListQuery } from "@/services/users";
import {
  USER_FILTER_OPTIONS,
  USER_LAST_ACTIVE_OPTIONS,
  labelForFilterValue,
  type UserFilters,
} from "./user-filters";

export interface UserExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: UserListQuery;
  filters: UserFilters;
  search: string;
  rowCount: number;
  piiIncluded: boolean;
}

function labelsFor<T extends string>(
  values: readonly T[],
  options: ReadonlyArray<{ value: T; label: string }>,
): string {
  return values
    .map((value) => options.find((option) => option.value === value)?.label ?? labelForFilterValue(value))
    .join(", ");
}

function rangeSummary(label: string, min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  return `${label}: ${min ?? "any"} to ${max ?? "any"}`;
}

function formatRowCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Builds the human-readable filter summary shown before the high-tier export confirmation. */
export function buildUserExportSummary(search: string, filters: UserFilters): string[] {
  const summary: string[] = [];
  const trimmedSearch = search.trim();

  if (trimmedSearch) summary.push(`Search: ${trimmedSearch}`);
  if (filters.status.length > 0) {
    summary.push(`Status: ${labelsFor(filters.status, USER_FILTER_OPTIONS.status)}`);
  }
  if (filters.emailVerified !== "ANY") {
    summary.push(`Email: ${filters.emailVerified === "VERIFIED" ? "Verified" : "Unverified"}`);
  }
  if (filters.workStatus.length > 0) {
    summary.push(`Work status: ${labelsFor(filters.workStatus, USER_FILTER_OPTIONS.workStatus)}`);
  }
  if (filters.university) summary.push(`University: ${filters.university}`);
  if (filters.gender.length > 0) {
    summary.push(`Gender: ${labelsFor(filters.gender, USER_FILTER_OPTIONS.gender)}`);
  }
  if (filters.language.length > 0) {
    summary.push(`Language: ${labelsFor(filters.language, USER_FILTER_OPTIONS.language)}`);
  }
  if (filters.authProvider.length > 0) {
    summary.push(`Sign-in provider: ${labelsFor(filters.authProvider, USER_FILTER_OPTIONS.authProvider)}`);
  }

  const level = rangeSummary("Level", filters.levelMin, filters.levelMax);
  if (level) summary.push(level);
  const xp = rangeSummary("XP", filters.xpMin, filters.xpMax);
  if (xp) summary.push(xp);

  if (filters.createdFrom || filters.createdTo) {
    summary.push(`Registered: ${filters.createdFrom || "any date"} to ${filters.createdTo || "any date"}`);
  }
  if (filters.lastActive) {
    const label = USER_LAST_ACTIVE_OPTIONS.find((option) => option.value === filters.lastActive)?.label;
    summary.push(`Last active: ${label ?? filters.lastActive}`);
  }
  if (filters.banned) summary.push("Banned accounts only");
  if (filters.includeDeleted) summary.push("Include deleted accounts");

  return summary.length > 0 ? summary : ["All users (no filters)"];
}

function exportErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.rawCode ?? error.code) {
    case "EXPORT_TOO_LARGE":
      return "This export contains more than 50,000 rows. Narrow the search or filters and try again.";
    case "FORBIDDEN":
      return "You do not have permission to export user records.";
    case "VALIDATION_ERROR":
      return "Check the selected filters and provide a reason with at least 10 characters.";
    case "RATE_LIMITED":
      return "Too many export requests were made. Wait a moment and try again.";
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

function SummaryList({ items }: { items: readonly string[] }): ReactNode {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** High-tier confirmation and direct browser download for the current Users table state. */
export function UserExportDialog({
  open,
  onOpenChange,
  query,
  filters,
  search,
  rowCount,
  piiIncluded,
}: UserExportDialogProps) {
  const filterSummary = buildUserExportSummary(search, filters);
  const confirmationTarget = `EXPORT ${rowCount} USERS`;

  const confirmExport = async (reason: string) => {
    const result = await exportUsersCsv(query, reason);
    triggerBrowserDownload(result);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tier="high"
      title="Export filtered users?"
      description="The server will record this export in the admin audit trail."
      consequence={
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">Current filter</p>
            <SummaryList items={filterSummary} />
          </div>
          <p>
            <span className="font-medium text-foreground">Matching rows:</span>{" "}
            {formatRowCount(rowCount)}
          </p>
          <p>
            {piiIncluded
              ? "Phone number and date of birth are included because you have user:export:pii."
              : "Phone number and date of birth will be masked because you do not have user:export:pii."}
          </p>
        </div>
      }
      confirmLabel="Download CSV"
      confirmTarget={confirmationTarget}
      confirmTargetLabel="confirmation phrase"
      errorMessageFor={exportErrorMessage}
      onConfirm={confirmExport}
    />
  );
}

/** Presentational action used in the Users page header and kept permission-agnostic for tests. */
export function UserExportButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label="Export users as CSV"
      title={disabled ? "Load the current user list before exporting" : undefined}
    >
      Export CSV
    </Button>
  );
}
