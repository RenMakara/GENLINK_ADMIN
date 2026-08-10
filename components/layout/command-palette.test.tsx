// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "./command-palette";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
});
