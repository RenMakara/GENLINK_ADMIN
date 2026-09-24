"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/services/query-keys";
import { createUserNote, type UserNoteRequest } from "@/services/users";

/** Safe, code-based copy for known staff-note failures. */
export function userNoteErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  switch (error.code) {
    case "FORBIDDEN":
      return "You are not authorized to add staff notes.";
    case "NOT_FOUND":
      return "This user no longer exists. Refresh the record before trying again.";
    case "VALIDATION_ERROR":
      return "Enter a staff note with no more than 4,000 characters.";
    default:
      return null;
  }
}

/** Appends one staff-only note and refreshes the Notes tab projection. */
export function useUserNote(userId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, unknown, UserNoteRequest>({
    mutationFn: (request) => createUserNote(userId, request),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users.notesAll(userId) }).then(() => undefined),
  });

  return {
    execute: (request: UserNoteRequest) => mutation.mutateAsync(request).then(() => undefined),
    pending: mutation.isPending,
  };
}
