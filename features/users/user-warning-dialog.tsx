"use client";

import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { AdminUserDetail } from "./types";
import { userWarningErrorMessage } from "./user-warning";
import type { UserWarningRequest, UserWarningSeverity } from "@/services/users";

export const USER_WARNING_SEVERITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export interface UserWarningDialogProps {
  user: AdminUserDetail;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (request: UserWarningRequest) => Promise<void>;
}

function subjectName(user: AdminUserDetail): string {
  return user.fullName || (user.username ? `@${user.username}` : "this user");
}

function humanizeSeverity(severity: UserWarningSeverity): string {
  return severity.charAt(0) + severity.slice(1).toLowerCase();
}

function validMessage(value: string): boolean {
  const length = value.trim().length;
  return length > 0 && length <= 2_000;
}

export function UserWarningDialog({
  user,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: UserWarningDialogProps) {
  const severityId = useId();
  const englishId = useId();
  const khmerId = useId();
  const [severity, setSeverity] = useState<UserWarningSeverity>("MEDIUM");
  const [messageEn, setMessageEn] = useState("");
  const [messageKm, setMessageKm] = useState("");
  const messagesValid = validMessage(messageEn) && validMessage(messageKm);
  const showMessageError = Boolean(messageEn || messageKm) && !messagesValid;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Issue warning to ${subjectName(user)}?`}
      description="The warning is recorded in the enforcement history with bilingual message text."
      consequence="Recorded. In-app delivery arrives in a later release. Do not assume the user was notified."
      confirmLabel="Record warning"
      pending={pending}
      confirmDisabled={!messagesValid}
      errorMessageFor={userWarningErrorMessage}
      onConfirm={(reason) =>
        onConfirm({
          severity,
          reason,
          messageEn: messageEn.trim(),
          messageKm: messageKm.trim(),
        })
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={severityId}>Severity</Label>
        <select
          id={severityId}
          value={severity}
          onChange={(event) => setSeverity(event.currentTarget.value as UserWarningSeverity)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          disabled={pending}
        >
          {USER_WARNING_SEVERITIES.map((option) => (
            <option key={option} value={option}>
              {humanizeSeverity(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={englishId}>Message in English</Label>
          <Textarea
            id={englishId}
            value={messageEn}
            onChange={(event) => setMessageEn(event.currentTarget.value)}
            maxLength={2_000}
            rows={5}
            lang="en"
            placeholder="Explain the warning for the user."
            aria-invalid={showMessageError && !validMessage(messageEn)}
            aria-describedby={`${englishId}-hint`}
            disabled={pending}
          />
          <p id={`${englishId}-hint`} className="text-xs text-muted-foreground">
            Required; maximum 2,000 characters.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={khmerId}>Message in Khmer</Label>
          <Textarea
            id={khmerId}
            value={messageKm}
            onChange={(event) => setMessageKm(event.currentTarget.value)}
            maxLength={2_000}
            rows={5}
            lang="km"
            className="font-khmer"
            placeholder="សរសេរសារព្រមានជាភាសាខ្មែរ"
            aria-invalid={showMessageError && !validMessage(messageKm)}
            aria-describedby={`${khmerId}-hint`}
            disabled={pending}
          />
          <p id={`${khmerId}-hint`} className="text-xs text-muted-foreground">
            <span lang="km" className="font-khmer">ត្រូវការ; អតិបរមា ២,០០០ តួអក្សរ។</span>
          </p>
        </div>
      </div>

      {showMessageError ? (
        <p role="alert" className="text-sm text-destructive">
          Enter both bilingual messages, each no longer than 2,000 characters.
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
