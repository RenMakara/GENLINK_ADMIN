"use client";

import { useId, useMemo, useState } from "react";
import { Ban, Bell, Download, Medal, X } from "lucide-react";

import { ConfirmDialog } from "@/components/common";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBulkActions, useAdminBadges, useAdminNotificationTemplates, type AggregatedBulkResult } from "@/services/bulk-actions";
import { ApiError } from "@/lib/api/errors";
import type { AdminBadgeOption, AdminNotificationTemplate } from "@/lib/api/types";
import { usePermissions } from "@/hooks/use-permission";

import type { AdminUserTableRow } from "./types";

const ADMIN_TEMPLATE_KEY_PATTERN = /^ADMIN_[A-Z0-9]+(?:[_.-][A-Z0-9]+)*$/;

type DialogAction = "ban" | "notify" | "badge" | null;

export interface BulkActionBarProps {
  selectedUserIds: readonly string[];
  selectedUsers: readonly AdminUserTableRow[];
  onClearSelection: () => void;
}

function bulkActionErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.rawCode ?? error.code) {
    case "FORBIDDEN":
      return "You are not authorized to perform this bulk action.";
    case "NOT_FOUND":
      return "One or more selected users no longer exist. Refresh the list and try again.";
    case "USER_ANONYMISED":
      return "One or more selected users have been anonymised and cannot be changed.";
    case "ADMIN_NOTIFICATION_TEMPLATE_NOT_FOUND":
      return "That notification template does not exist. Choose an existing ADMIN_ template.";
    case "ADMIN_NOTIFICATION_TEMPLATE_INVALID":
      return "The notification template or parameters are invalid.";
    case "BULK_LIMIT_EXCEEDED":
      return "The selection exceeded the server limit. Clear the selection and try again.";
    case "VALIDATION_ERROR":
      return "Check the action fields and provide a reason with at least 10 characters.";
    default:
      return null;
  }
}

function readableFailureReason(errorCode: string): string {
  switch (errorCode) {
    case "NOT_FOUND":
      return "User no longer exists.";
    case "USER_ALREADY_BANNED":
      return "User is already banned.";
    case "USER_ANONYMISED":
      return "Account has been anonymised.";
    case "ADMIN_NOTIFICATION_INVALID_RECIPIENTS":
      return "User is not eligible for in-app notifications.";
    case "ADMIN_NOTIFICATION_TEMPLATE_NOT_FOUND":
      return "Notification template was not found.";
    case "INTERNAL_SERVER_ERROR":
      return "The service did not complete this request.";
    default:
      return "The action could not be completed for this user.";
  }
}

function userLabel(user: AdminUserTableRow | undefined, id: string): string {
  if (user?.fullName) return user.fullName;
  if (user?.email) return user.email;
  return `Selected user (${id})`;
}

export function BulkActionResultView({
  result,
  selectedUsers,
  onDismiss,
}: {
  result: AggregatedBulkResult;
  selectedUsers: readonly AdminUserTableRow[];
  onDismiss: () => void;
}) {
  const selectedById = useMemo(
    () => new Map(selectedUsers.map((user) => [user.userId, user])),
    [selectedUsers],
  );
  const failures = result.failed.length;

  return (
    <Alert
      variant={failures > 0 ? "destructive" : "default"}
      className="sticky bottom-4 z-20 shadow-lg"
      aria-live="polite"
    >
      <AlertTitle>
        {result.succeeded} of {result.requested} succeeded
      </AlertTitle>
      <AlertDescription>
        {failures > 0
          ? `${failures} selected ${failures === 1 ? "user was" : "users were"} not changed.`
          : "The selected users were processed successfully."}
        {failures > 0 ? (
          <details className="mt-3 rounded-md border border-current/20 p-2">
            <summary className="cursor-pointer rounded-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Show failure details ({failures})
            </summary>
            <ul className="mt-2 space-y-2 pl-5 text-sm" aria-label="Bulk action failures">
              {result.failed.map((failure) => (
                <li key={`${failure.id}-${failure.errorCode}`}>
                  <span className="font-medium">{userLabel(selectedById.get(failure.id), failure.id)}</span>
                  <span className="ml-2">{readableFailureReason(failure.errorCode)}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onDismiss}>
          Dismiss result
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function bulkConfirmationTarget(count: number): string {
  return `BAN ${count} USERS`;
}

function BulkNotifyDialog({
  open,
  count,
  pending,
  templates,
  templatesLoading,
  templatesError,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  count: number;
  pending: boolean;
  templates: readonly AdminNotificationTemplate[];
  templatesLoading: boolean;
  templatesError: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: {
    templateKey: string;
    parameters: Record<string, string>;
    reason: string;
  }) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <BulkNotifyDialogBody
      key="bulk-notify-dialog"
      count={count}
      pending={pending}
      templates={templates}
      templatesLoading={templatesLoading}
      templatesError={templatesError}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}

function BulkNotifyDialogBody({
  count,
  pending,
  templates,
  templatesLoading,
  templatesError,
  onOpenChange,
  onConfirm,
}: Omit<React.ComponentProps<typeof BulkNotifyDialog>, "open">) {
  const templateId = useId();
  const parametersId = useId();
  const [templateKey, setTemplateKey] = useState("");
  const [parametersText, setParametersText] = useState("");

  const parameterState = useMemo(() => {
    if (!parametersText.trim()) return { value: {}, error: null };
    try {
      const parsed: unknown = JSON.parse(parametersText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { value: {}, error: "Parameters must be a JSON object." };
      }
      const entries = Object.entries(parsed);
      if (entries.length > 20 || entries.some(([, value]) => typeof value !== "string")) {
        return { value: {}, error: "Use at most 20 string parameters." };
      }
      return { value: Object.fromEntries(entries) as Record<string, string>, error: null };
    } catch {
      return { value: {}, error: "Parameters must be valid JSON." };
    }
  }, [parametersText]);

  const trimmedTemplateKey = templateKey.trim();
  const templateError = trimmedTemplateKey && !ADMIN_TEMPLATE_KEY_PATTERN.test(trimmedTemplateKey)
    ? "Use an existing key in the ADMIN_ namespace."
    : null;
  const invalid = !ADMIN_TEMPLATE_KEY_PATTERN.test(trimmedTemplateKey) || parameterState.error !== null;
  const datalistId = `${templateId}-options`;

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Notify ${count} selected users?`}
      description="Queues one in-app notification for each eligible selected account."
      consequence="The server validates the ADMIN_ template and reports ineligible recipients individually. This does not send an email."
      confirmLabel="Queue notifications"
      pending={pending}
      confirmDisabled={invalid}
      errorMessageFor={bulkActionErrorMessage}
      onConfirm={(reason) =>
        onConfirm({ templateKey: trimmedTemplateKey, parameters: parameterState.value, reason })
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={templateId}>Notification template key</Label>
        <Input
          id={templateId}
          list={datalistId}
          value={templateKey}
          onChange={(event) => setTemplateKey(event.currentTarget.value)}
          placeholder="ADMIN_ACCOUNT_REVIEW"
          aria-invalid={templateError !== null}
          disabled={pending}
        />
        <datalist id={datalistId}>
          {templates.map((template) => (
            <option key={template.id} value={template.templateKey}>
              {template.titleEn}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          {templatesLoading
            ? "Loading template suggestions…"
            : templatesError
              ? "Suggestions are unavailable; enter an existing ADMIN_ key manually."
              : templates.length > 0
                ? "Suggestions come from the Admin template catalogue."
                : "Enter an existing ADMIN_ template key."}
        </p>
        {templateError ? <p className="text-sm text-destructive">{templateError}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={parametersId}>Template parameters (optional JSON)</Label>
        <Textarea
          id={parametersId}
          value={parametersText}
          onChange={(event) => setParametersText(event.currentTarget.value)}
          placeholder='{"caseId":"review-123"}'
          aria-invalid={parameterState.error !== null}
          disabled={pending}
        />
        {parameterState.error ? <p className="text-sm text-destructive">{parameterState.error}</p> : null}
      </div>
    </ConfirmDialog>
  );
}

function BulkBadgeDialog({
  open,
  count,
  pending,
  badges,
  badgesLoading,
  badgesError,
  onRetry,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  count: number;
  pending: boolean;
  badges: readonly AdminBadgeOption[];
  badgesLoading: boolean;
  badgesError: boolean;
  onRetry: () => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { badgeId: string; reason: string }) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <BulkBadgeDialogBody
      key="bulk-badge-dialog"
      count={count}
      pending={pending}
      badges={badges}
      badgesLoading={badgesLoading}
      badgesError={badgesError}
      onRetry={onRetry}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}

function BulkBadgeDialogBody({
  count,
  pending,
  badges,
  badgesLoading,
  badgesError,
  onRetry,
  onOpenChange,
  onConfirm,
}: Omit<React.ComponentProps<typeof BulkBadgeDialog>, "open">) {
  const badgeId = useId();
  const [badgeSelection, setBadgeSelection] = useState("");
  const selectedBadgeId = badgeSelection || badges[0]?.badgeId || "";

  const selectedBadge = badges.find((badge) => badge.badgeId === selectedBadgeId);
  const unavailable = badgesLoading || badgesError || badges.length === 0 || !selectedBadgeId;

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Assign a badge to ${count} selected users?`}
      description="The selected active badge will be assigned independently to each account."
      consequence="Already-assigned badges remain unchanged, and deleted or invalid users are reported in the partial-success result."
      confirmLabel="Assign badge"
      pending={pending}
      confirmDisabled={unavailable}
      errorMessageFor={bulkActionErrorMessage}
      onConfirm={(reason) => onConfirm({ badgeId: selectedBadgeId, reason })}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={badgeId}>Badge</Label>
        {badges.length > 0 ? (
          <select
            id={badgeId}
            value={selectedBadgeId}
            onChange={(event) => setBadgeSelection(event.currentTarget.value)}
            disabled={pending || badgesLoading}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {badges.map((badge) => (
              <option key={badge.badgeId} value={badge.badgeId}>
                {badge.nameEn || badge.nameKm || "Unnamed badge"}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
            {badgesLoading ? "Loading active badges…" : badgesError ? "Badge catalogue unavailable." : "No active badges are available."}
          </p>
        )}
        {selectedBadge?.descriptionEn ? (
          <p className="text-xs text-muted-foreground">{selectedBadge.descriptionEn}</p>
        ) : null}
        {badgesError ? (
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry} disabled={pending}>
            Retry badge catalogue
          </Button>
        ) : null}
      </div>
    </ConfirmDialog>
  );
}

interface BulkActionBarContentProps extends BulkActionBarProps {
  result: AggregatedBulkResult | null;
  resultUsers: readonly AdminUserTableRow[];
  setResult: (result: AggregatedBulkResult | null) => void;
  setResultUsers: (users: readonly AdminUserTableRow[]) => void;
}

function BulkActionBarContent({
  selectedUserIds,
  selectedUsers,
  onClearSelection,
  result,
  resultUsers,
  setResult,
  setResultUsers,
}: BulkActionBarContentProps) {
  const { has } = usePermissions();
  const bulk = useBulkActions();
  const canBan = has("user:ban");
  const canNotify = has("notification:send");
  const canBadge = has("badge:assign");
  const canSuggestTemplates = has("notification:template:manage");
  const [dialog, setDialog] = useState<DialogAction>(null);
  const selectedCount = selectedUserIds.length;
  const badgesQuery = useAdminBadges(canBadge);
  const templatesQuery = useAdminNotificationTemplates(canSuggestTemplates && canNotify);

  const dismiss = () => {
    setResult(null);
    setResultUsers([]);
    onClearSelection();
  };

  const complete = (nextResult: AggregatedBulkResult) => {
    setResult(nextResult);
    setResultUsers(selectedUsers);
    onClearSelection();
  };

  const confirmBan = async (reason: string) => {
    const nextResult = await bulk.execute({ action: "ban", userIds: selectedUserIds, reason });
    complete(nextResult);
  };

  const confirmNotify = async (input: {
    templateKey: string;
    parameters: Record<string, string>;
    reason: string;
  }) => {
    const nextResult = await bulk.execute({
      action: "notify",
      userIds: selectedUserIds,
      ...input,
    });
    complete(nextResult);
  };

  const confirmBadge = async (input: { badgeId: string; reason: string }) => {
    const nextResult = await bulk.execute({
      action: "badge",
      userIds: selectedUserIds,
      ...input,
    });
    complete(nextResult);
  };

  if (selectedCount === 0 && !result) return null;

  const selectedLabel = selectedCount === 1 ? "user" : "users";

  return (
    <div className="flex flex-col gap-3">
      {selectedCount > 0 ? (
        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-primary/30 bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium" aria-live="polite">
            {selectedCount} {selectedLabel} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {canBan ? (
              <Button type="button" variant="destructive" size="sm" onClick={() => { setResult(null); setDialog("ban"); }} disabled={bulk.pending}>
                <Ban aria-hidden="true" />
                Ban
              </Button>
            ) : null}
            {canNotify ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { setResult(null); setDialog("notify"); }} disabled={bulk.pending}>
                <Bell aria-hidden="true" />
                Notify
              </Button>
            ) : null}
            {canBadge ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { setResult(null); setDialog("badge"); }} disabled={bulk.pending}>
                <Medal aria-hidden="true" />
                Assign badge
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" disabled title="CSV export is implemented in ADM-099">
              <Download aria-hidden="true" />
              Export
              <span className="sr-only">available in ADM-099</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={dismiss} disabled={bulk.pending}>
              <X aria-hidden="true" />
              Clear selection
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <BulkActionResultView result={result} selectedUsers={resultUsers} onDismiss={dismiss} />
      ) : null}

      <ConfirmDialog
        open={dialog === "ban"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        tier="high"
        title={`Ban ${selectedCount} selected ${selectedLabel}?`}
        description="This is an immediate account-enforcement action over the current selection."
        consequence="Each user is processed independently, active sessions are revoked for successful bans, and every outcome is written to the audit trail. Type the confirmation phrase exactly to continue."
        confirmLabel="Ban selected users"
        confirmTarget={bulkConfirmationTarget(selectedCount)}
        confirmTargetLabel="confirmation phrase"
        pending={bulk.pending}
        errorMessageFor={bulkActionErrorMessage}
        onConfirm={confirmBan}
      />

      <BulkNotifyDialog
        open={dialog === "notify"}
        count={selectedCount}
        pending={bulk.pending}
        templates={templatesQuery.data ?? []}
        templatesLoading={templatesQuery.isLoading}
        templatesError={templatesQuery.isError}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onConfirm={confirmNotify}
      />

      <BulkBadgeDialog
        open={dialog === "badge"}
        count={selectedCount}
        pending={bulk.pending}
        badges={badgesQuery.data ?? []}
        badgesLoading={badgesQuery.isLoading}
        badgesError={badgesQuery.isError}
        onRetry={() => void badgesQuery.refetch()}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onConfirm={confirmBadge}
      />
    </div>
  );
}

/** ADM-098: the selection toolbar and honest partial-success result view for the Users table. */
export function BulkActionBar(props: BulkActionBarProps) {
  const [result, setResult] = useState<AggregatedBulkResult | null>(null);
  const [resultUsers, setResultUsers] = useState<readonly AdminUserTableRow[]>([]);

  if (props.selectedUserIds.length === 0 && !result) return null;

  return (
    <BulkActionBarContent
      {...props}
      result={result}
      resultUsers={resultUsers}
      setResult={setResult}
      setResultUsers={setResultUsers}
    />
  );
}
