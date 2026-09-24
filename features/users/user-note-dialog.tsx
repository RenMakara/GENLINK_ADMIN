"use client";

import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/common";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { AdminUserDetail } from "./types";
import { userNoteErrorMessage } from "./user-note";

export interface UserNoteDialogProps {
  user: AdminUserDetail;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => Promise<void>;
}

function subjectName(user: AdminUserDetail): string {
  return user.fullName || (user.username ? `@${user.username}` : "this user");
}

export function UserNoteDialog({
  user,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: UserNoteDialogProps) {
  const noteId = useId();
  const [note, setNote] = useState("");
  const valid = note.trim().length > 0 && note.trim().length <= 4_000;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tier="low"
      title={`Add an internal note for ${subjectName(user)}?`}
      description="This note is appended to the staff record and cannot be edited from the Admin portal."
      consequence="Visible to staff only. The user will not see this note."
      confirmLabel="Add note"
      destructive={false}
      pending={pending}
      confirmDisabled={!valid}
      errorMessageFor={userNoteErrorMessage}
      onConfirm={() => onConfirm(note.trim())}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={noteId}>Internal note</Label>
        <Textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          maxLength={4_000}
          rows={6}
          placeholder="Write a factual note for other staff members."
          aria-describedby={`${noteId}-hint`}
          aria-invalid={note.length > 4_000}
          disabled={pending}
        />
        <p id={`${noteId}-hint`} className="text-xs text-muted-foreground">
          Append-only and visible to staff only. Maximum 4,000 characters.
        </p>
      </div>
    </ConfirmDialog>
  );
}
