// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PageResponse } from "@/lib/api/types";

import type { AdminUserNote } from "./types";
import { UserNotesTab } from "./user-notes-tab";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
}));

const permissionState = vi.hoisted(() => ({
  canAdd: true,
}));

const queryState = vi.hoisted(() => ({
  value: {
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null as unknown,
    data: undefined as PageResponse<AdminUserNote> | undefined,
    refetch: vi.fn(),
  },
  args: [] as Array<[string, number, number]>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/users/user-1",
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    permissions: permissionState.canAdd ? ["user:note:write"] : [],
    ready: true,
    has: (permission: string) => permissionState.canAdd && permission === "user:note:write",
    hasAll: () => permissionState.canAdd,
    hasAny: () => permissionState.canAdd,
  }),
}));

vi.mock("@/services/users", () => ({
  useUserNotes: (userId: string, page: number, size: number) => {
    queryState.args.push([userId, page, size]);
    return queryState.value;
  },
}));

function page(content: AdminUserNote[], overrides: Partial<PageResponse<AdminUserNote>> = {}): PageResponse<AdminUserNote> {
  return {
    content,
    page: 0,
    size: 25,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    hasNext: false,
    ...overrides,
  };
}

function makeNote(overrides: Partial<AdminUserNote> = {}): AdminUserNote {
  return {
    noteId: "note-1",
    userId: "user-1",
    adminUserId: "admin-1",
    note: "Follow up with the account owner.",
    createdAt: "2026-09-24T03:00:00Z",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  queryState.value.isLoading = false;
  queryState.value.isFetching = false;
  queryState.value.isError = false;
  queryState.value.error = null;
  queryState.value.data = undefined;
  queryState.value.refetch.mockClear();
  queryState.args = [];
  permissionState.canAdd = true;
  navigation.replace.mockClear();
});

describe("UserNotesTab (ADM-096)", () => {
  it("renders the staff-only thread, add action, and pagination controls", () => {
    queryState.value.data = page([makeNote()], { totalElements: 26, totalPages: 2, hasNext: true });
    const onAddNote = vi.fn();

    render(<UserNotesTab userId="user-1" onAddNote={onAddNote} />);

    expect(screen.getByText("Visible to staff only")).toBeDefined();
    expect(screen.getByRole("list", { name: "Staff notes" })).toBeDefined();
    expect(screen.getByText("Follow up with the account owner.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add note" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    expect(onAddNote).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Go to next notes page" })).toBeDefined();
    expect(queryState.args.at(-1)).toEqual(["user-1", 0, 25]);

    fireEvent.click(screen.getByRole("button", { name: "Go to next notes page" }));
    expect(navigation.replace).toHaveBeenCalledWith("/users/user-1?notesPage=2", { scroll: false });
  });

  it("hides the add action without user:note:write", () => {
    permissionState.canAdd = false;
    queryState.value.data = page([makeNote()]);

    render(<UserNotesTab userId="user-1" onAddNote={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Add note" })).toBeNull();
  });

  it("keeps loading, error, and empty states distinct", () => {
    queryState.value.isLoading = true;
    render(<UserNotesTab userId="user-1" />);
    expect(screen.getByRole("status", { name: "Loading staff notes" })).toBeDefined();

    cleanup();
    queryState.value.isLoading = false;
    queryState.value.isError = true;
    queryState.value.error = new Error("internal database details");
    render(<UserNotesTab userId="user-1" />);
    expect(screen.getByText("Staff notes unavailable")).toBeDefined();
    expect(screen.queryByText("internal database details")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(queryState.value.refetch).toHaveBeenCalledOnce();

    cleanup();
    queryState.value.isError = false;
    queryState.value.data = page([]);
    render(<UserNotesTab userId="user-1" />);
    expect(screen.getByText("No staff notes")).toBeDefined();
  });
});
