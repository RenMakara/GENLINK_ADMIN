"use client";

import { FileText, Plus } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permission";
import { useTableState, type UseTableStateOptions } from "@/hooks/use-table-state";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/date";
import { useUserNotes } from "@/services/users";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const NOTES_TABLE_STATE_OPTIONS: UseTableStateOptions = {
  defaultPageSize: PAGE_SIZE_OPTIONS[0],
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  pageParam: "notesPage",
  pageSizeParam: "notesSize",
  history: "replace",
};

function notesErrorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view this user's staff notes.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "This user no longer exists. Refresh the record and try again.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The staff-notes service is unavailable. Check the API connection and try again.";
  }
  return "We could not load this user's staff notes right now. Please try again.";
}

/** ADM-096: append-only staff thread with an explicit visibility boundary. */
export function UserNotesTab({
  userId,
  onAddNote,
}: {
  userId: string;
  onAddNote?: () => void;
}) {
  const tableState = useTableState(NOTES_TABLE_STATE_OPTIONS);
  const { has } = usePermissions();
  const canAddNote = has("user:note:write");
  const notesQuery = useUserNotes(userId, tableState.pageIndex, tableState.pageSize);
  const notes = notesQuery.data?.content ?? [];
  const totalPages = notesQuery.data?.totalPages ?? 0;
  const currentPage = tableState.pageIndex + 1;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Admin notes</CardTitle>
            <Badge variant="secondary">Visible to staff only</Badge>
          </div>
          <CardDescription>
            Append-only notes for staff context. The user cannot see or edit this thread.
          </CardDescription>
        </div>
        {canAddNote && onAddNote ? (
          <CardAction>
            <Button type="button" size="sm" onClick={onAddNote}>
              <Plus aria-hidden="true" />
              Add note
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="pt-4">
        {notesQuery.isLoading ? (
          <div role="status" aria-label="Loading staff notes" aria-busy="true" className="flex flex-col gap-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : notesQuery.isError ? (
          <ErrorState
            title="Staff notes unavailable"
            description={notesErrorDescription(notesQuery.error)}
            onRetry={() => void notesQuery.refetch()}
          />
        ) : notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No staff notes"
            description="No internal notes have been recorded for this user."
          />
        ) : (
          <div className="flex flex-col gap-3" aria-label="Staff notes" role="list">
            {notes.map((entry) => (
              <article
                key={entry.noteId}
                role="listitem"
                className="rounded-lg border border-border bg-muted/20 p-4"
                data-testid="staff-note"
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                  {entry.note}
                </p>
                <time
                  dateTime={entry.createdAt}
                  title={formatDateTime(entry.createdAt)}
                  className="mt-3 block text-xs text-muted-foreground"
                >
                  Recorded {formatDateTime(entry.createdAt)}
                </time>
              </article>
            ))}
          </div>
        )}

        {notesQuery.data && notes.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Page {currentPage} of {totalPages || 1} · {notesQuery.data.totalElements} note
              {notesQuery.data.totalElements === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => tableState.setPageIndex(tableState.pageIndex - 1)}
                disabled={tableState.pageIndex === 0 || notesQuery.isFetching}
                aria-label="Go to previous notes page"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => tableState.setPageIndex(tableState.pageIndex + 1)}
                disabled={!notesQuery.data.hasNext || notesQuery.isFetching}
                aria-label="Go to next notes page"
              >
                Next
              </Button>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="sr-only">Notes per page</span>
                <select
                  aria-label="Notes per page"
                  value={tableState.pageSize}
                  onChange={(event) => tableState.setPageSize(Number(event.currentTarget.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  disabled={notesQuery.isFetching}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
