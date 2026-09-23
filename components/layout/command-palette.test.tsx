// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PageResponse } from "@/lib/api/types";
import type { AdminUserTableRow } from "@/features/users/types";

import { CommandPalette } from "./command-palette";

const paletteRouter = vi.hoisted(() => ({ push: vi.fn() }));
const userSearchState = vi.hoisted(() => ({
  calls: [] as Array<{ query: string; enabled: boolean }>,
  value: {
    isLoading: false,
    isError: false,
    data: undefined as PageResponse<AdminUserTableRow> | undefined,
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => paletteRouter,
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/services/users", () => ({
  useUserSearch: (query: string, enabled: boolean) => {
    userSearchState.calls.push({ query, enabled });
    return userSearchState.value;
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  userSearchState.calls = [];
  userSearchState.value.data = undefined;
});

describe("CommandPalette (ADM-057)", () => {
  it("opens via global Ctrl+K / ⌘K shortcut (AC#3)", () => {
    const handleOpenChange = vi.fn();
    render(<CommandPalette open={false} onOpenChange={handleOpenChange} userPermissions={["dashboard:view"]} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it("filters out entries that viewer lacks permissions for (AC#2)", () => {
    // Admin lacks user:export
    const permissions = ["dashboard:view", "user:read"];

    render(<CommandPalette open={true} onOpenChange={vi.fn()} userPermissions={permissions} />);

    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Users")).toBeDefined();

    // Export action is omitted
    expect(screen.queryByText("Export user list")).toBeNull();
  });

  it("is fully keyboard operable including Escape to close (AC#1)", () => {
    const handleOpenChange = vi.fn();
    render(
      <CommandPalette
        open={true}
        onOpenChange={handleOpenChange}
        userPermissions={["dashboard:view", "user:read"]}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Type a command or search...");
    fireEvent.keyDown(searchInput, { key: "Escape" });

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("gives command results a visible focus style (ADM-058)", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        userPermissions={["dashboard:view"]}
      />,
    );

    const dashboardCommand = screen.getByRole("button", { name: "Dashboard Navigation" });
    expect(dashboardCommand.className).toContain("focus-visible:ring-2");
    expect(dashboardCommand.className).toContain("focus-visible:ring-ring");
  });

  it("debounces permitted user search and opens the selected user by keyboard (ADM-076)", () => {
    vi.useFakeTimers();
    userSearchState.value.data = {
      content: [
        {
          userId: "397939ea-0e71-4bb5-9b4a-3d2707296630",
          fullName: "Dara Sok",
          username: "dara.sok",
          email: "dara@example.com",
          avatarUrl: null,
          emailVerified: true,
          accountStatus: "ACTIVE",
          adminRoleName: null,
          universityName: null,
          workStatus: null,
          level: 3,
          totalXp: 240,
          createdAt: "2026-01-01T00:00:00Z",
          lastActiveAt: "2026-09-24T00:00:00Z",
        },
      ],
      page: 0,
      size: 5,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    };

    try {
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          userPermissions={["user:read"]}
        />,
      );

      const input = screen.getByRole("textbox", { name: "Command search" });
      fireEvent.change(input, { target: { value: "dara@example.com" } });
      expect(userSearchState.calls.some((call) => call.query === "dara@example.com" && call.enabled)).toBe(
        false,
      );

      act(() => vi.advanceTimersByTime(299));
      expect(userSearchState.calls.some((call) => call.query === "dara@example.com" && call.enabled)).toBe(
        false,
      );

      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByText("Dara Sok")).toBeDefined();
      expect(userSearchState.calls.some((call) => call.query === "dara@example.com" && call.enabled)).toBe(
        true,
      );

      fireEvent.keyDown(input, { key: "Enter" });
      expect(paletteRouter.push).toHaveBeenCalledWith(
        "/users/397939ea-0e71-4bb5-9b4a-3d2707296630",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not enable user search without user:read", () => {
    vi.useFakeTimers();

    try {
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          userPermissions={["dashboard:view"]}
        />,
      );

      fireEvent.change(screen.getByRole("textbox", { name: "Command search" }), {
        target: { value: "dara@example.com" },
      });
      act(() => vi.advanceTimersByTime(300));

      expect(userSearchState.calls.every((call) => !call.enabled)).toBe(true);
      expect(screen.queryByText("Dara Sok")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
