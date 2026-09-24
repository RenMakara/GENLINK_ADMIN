// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";

import { userNoteErrorMessage, useUserNote } from "./user-note";

const userServices = vi.hoisted(() => ({
  createUserNote: vi.fn(),
}));

vi.mock("@/services/users", () => userServices);

const USER_ID = "user-1";

function Harness() {
  const note = useUserNote(USER_ID);

  return createElement(
    "button",
    {
      type: "button",
      onClick: () => void note.execute({ note: "Follow up with the account owner." }),
    },
    "add note",
  );
}

function renderHarness(queryClient: QueryClient) {
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Harness),
    ),
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

afterEach(() => {
  cleanup();
  userServices.createUserNote.mockReset();
});

describe("useUserNote (ADM-096)", () => {
  it("appends the note and refreshes every notes page for the user", async () => {
    const queryClient = makeQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    userServices.createUserNote.mockResolvedValue({ noteId: "note-1" });

    renderHarness(queryClient);
    fireEvent.click(document.querySelector("button") as HTMLButtonElement);

    await waitFor(() => expect(userServices.createUserNote).toHaveBeenCalledOnce());
    expect(userServices.createUserNote).toHaveBeenCalledWith(USER_ID, {
      note: "Follow up with the account owner.",
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.users.notesAll(USER_ID),
    }));
  });

  it("does not display unknown API details", () => {
    expect(userNoteErrorMessage({})).toBeNull();
  });
});
