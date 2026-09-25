// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminPermissionGroup } from "@/types/admin-role";

import { groupSelectionState, PermissionMatrix } from "./permission-matrix";

const GROUPS: AdminPermissionGroup[] = [
  {
    resource: "user",
    permissions: [
      {
        code: "user:read",
        resource: "user",
        action: "read",
        description: "View user records",
      },
      {
        code: "user:ban",
        resource: "user",
        action: "ban",
        description: "Ban a user permanently",
      },
    ],
  },
];

afterEach(cleanup);

describe("PermissionMatrix (ADM-108)", () => {
  it("reports unchecked, checked, and indeterminate group states", () => {
    expect(groupSelectionState(["a", "b"], new Set())).toBe(false);
    expect(groupSelectionState(["a", "b"], new Set(["a"]))).toBe("indeterminate");
    expect(groupSelectionState(["a", "b"], new Set(["a", "b"]))).toBe(true);
  });

  it("renders grouped permissions and toggles a resource master checkbox", () => {
    const onToggleGroup = vi.fn();

    render(
      <PermissionMatrix
        groups={GROUPS}
        selectedPermissions={new Set(["user:read"])}
        onTogglePermission={vi.fn()}
        onToggleGroup={onToggleGroup}
      />,
    );

    expect(screen.getByRole("group", { name: "User" })).toBeDefined();
    expect(screen.getByText("View user records")).toBeDefined();
    expect(screen.getByText("Ban a user permanently")).toBeDefined();

    const master = screen.getByRole("checkbox", { name: "Grant all User permissions" });
    expect(master.getAttribute("data-state")).toBe("indeterminate");
    fireEvent.click(master);
    expect(onToggleGroup).toHaveBeenCalledWith(["user:read", "user:ban"], true);
  });

  it("disables all controls in read-only mode", () => {
    render(
      <PermissionMatrix
        groups={GROUPS}
        selectedPermissions={new Set(["user:read"])}
        disabled
        onTogglePermission={vi.fn()}
        onToggleGroup={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Grant all User permissions" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("checkbox", { name: /Read permission/i }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
