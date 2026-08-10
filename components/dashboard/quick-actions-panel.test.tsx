// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { QuickActionsPanel } from "./quick-actions-panel";

afterEach(() => {
  cleanup();
});

describe("QuickActionsPanel (ADM-054)", () => {
  it("omits export action for an admin without user:export permission (AC#1)", () => {
    const permissionsWithoutExport = ["user:read", "user:verify_email", "rbac:manage"];

    render(<QuickActionsPanel userPermissions={permissionsWithoutExport} />);

    expect(screen.queryByText("Export user list")).toBeNull();
    expect(screen.getByText("Search user")).toBeDefined();
    expect(screen.getByText("Review pending verifications")).toBeDefined();
    expect(screen.getByText("Invite admin")).toBeDefined();
  });

  it("renders all four quick actions for an admin with full permissions and links to target routes (AC#2)", () => {
    const fullPermissions = ["user:read", "user:verify_email", "user:export", "rbac:manage"];

    render(<QuickActionsPanel userPermissions={fullPermissions} />);

    const searchLink = screen.getByRole("link", { name: /Search user/i });
    expect(searchLink.getAttribute("href")).toBe("/users?focus=search");

    const verifyLink = screen.getByRole("link", { name: /Review pending verifications/i });
    expect(verifyLink.getAttribute("href")).toBe("/users?status=PENDING");

    const exportLink = screen.getByRole("link", { name: /Export user list/i });
    expect(exportLink.getAttribute("href")).toBe("/users?action=export");

    const inviteLink = screen.getByRole("link", { name: /Invite admin/i });
    expect(inviteLink.getAttribute("href")).toBe("/roles?action=invite");
  });

  it("renders empty state when admin holds zero permissions", () => {
    render(<QuickActionsPanel userPermissions={[]} />);

    expect(screen.getByText("No quick actions available")).toBeDefined();
  });
});
