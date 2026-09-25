import { Badge } from "@/components/ui/badge";

import type { AuditJsonValue } from "./audit-types";

const MISSING = Symbol("missing");
type DiffValue = AuditJsonValue | typeof MISSING;

export interface AuditDiffEntry {
  path: string;
  before: DiffValue;
  after: DiffValue;
  kind: "added" | "removed" | "changed";
}

function isRecord(value: DiffValue): value is { [key: string]: AuditJsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameValue(before: DiffValue, after: DiffValue): boolean {
  if (before === MISSING || after === MISSING) return before === after;
  return JSON.stringify(before) === JSON.stringify(after);
}

function valueFor(record: { [key: string]: AuditJsonValue }, key: string): DiffValue {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : MISSING;
}

function collectDiffs(before: DiffValue, after: DiffValue, path: string, entries: AuditDiffEntry[]) {
  if (sameValue(before, after)) return;

  if (isRecord(before) && isRecord(after)) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
    if (keys.length === 0) {
      entries.push({ path, before, after, kind: "changed" });
      return;
    }
    for (const key of keys) {
      collectDiffs(valueFor(before, key), valueFor(after, key), `${path}.${key}`, entries);
    }
    return;
  }

  if (isRecord(before) && after === MISSING) {
    const keys = Object.keys(before).sort();
    if (keys.length === 0) {
      entries.push({ path, before, after, kind: "removed" });
      return;
    }
    for (const key of keys) {
      collectDiffs(before[key], MISSING, `${path}.${key}`, entries);
    }
    return;
  }

  if (before === MISSING && isRecord(after)) {
    const keys = Object.keys(after).sort();
    if (keys.length === 0) {
      entries.push({ path, before, after, kind: "added" });
      return;
    }
    for (const key of keys) {
      collectDiffs(MISSING, after[key], `${path}.${key}`, entries);
    }
    return;
  }

  entries.push({
    path,
    before,
    after,
    kind: before === MISSING ? "added" : after === MISSING ? "removed" : "changed",
  });
}

/** Returns changed leaf fields rather than serialising two opaque JSON blobs. */
export function buildAuditDiff(
  before: AuditJsonValue | null,
  after: AuditJsonValue | null,
): AuditDiffEntry[] {
  const entries: AuditDiffEntry[] = [];
  collectDiffs(before, after, "$", entries);
  return entries;
}

export function formatAuditDiffValue(value: DiffValue): string {
  if (value === MISSING) return "Not present";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  return JSON.stringify(value);
}

function changeLabel(kind: AuditDiffEntry["kind"]): string {
  if (kind === "added") return "Added";
  if (kind === "removed") return "Removed";
  return "Changed";
}

/** Accessible, field-level before/after rendering for the audit detail drawer. */
export function AuditDiff({ before, after }: { before: AuditJsonValue | null; after: AuditJsonValue | null }) {
  const entries = buildAuditDiff(before, after);

  if (entries.length === 0) {
    return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No changed fields recorded.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[34rem] text-left text-sm" aria-label="Audit field changes">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Field</th>
            <th scope="col" className="px-3 py-2 font-medium">Before</th>
            <th scope="col" className="px-3 py-2 font-medium">After</th>
            <th scope="col" className="px-3 py-2 font-medium">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={`${entry.path}-${entry.kind}`}>
              <th scope="row" className="max-w-52 break-all px-3 py-2 align-top font-mono text-xs font-medium">
                {entry.path}
              </th>
              <td className="max-w-64 break-all px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                {formatAuditDiffValue(entry.before)}
              </td>
              <td className="max-w-64 break-all px-3 py-2 align-top font-mono text-xs text-foreground">
                {formatAuditDiffValue(entry.after)}
              </td>
              <td className="px-3 py-2 align-top">
                <Badge variant={entry.kind === "removed" ? "destructive" : entry.kind === "added" ? "default" : "secondary"}>
                  {changeLabel(entry.kind)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
