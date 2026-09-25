// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminSession } from "@/features/auth/auth-provider";

import { AdminMenu } from "./admin-menu";

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: auth.useAuth,
}));

vi.mock("@/features/auth/admin-security-dialog", () => ({
  AdminSecurityDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Security &amp; two-factor authentication</div> : null,
}));

const SESSION: AdminSession = {
  adminUserId: "admin-1",
  email: "admin@genlink.kh",
  fullName: "Sok Dara",
  roleCode: "SUPER_ADMIN",
  roleName: "Super Admin",
  permissions: ["rbac:manage"],
  lastLoginAt: "2026-08-01T17:30:00Z",
  totpEnabled: true,
  totpConfirmedAt: "2026-08-01T17:00:00Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminMenu (ADM-112)", () => {
  it("exposes the security section and current 2FA state from the avatar menu", async () => {
    auth.useAuth.mockReturnValue({ session: SESSION, signOut: vi.fn() });
    render(<AdminMenu />);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Account menu" }), {
      button: 0,
      ctrlKey: false,
    });

    expect(await screen.findByText("2FA enabled")).toBeDefined();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Security & 2FA" }));
    expect(await screen.findByRole("dialog")).toBeDefined();
  });
});
