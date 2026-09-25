// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminSession } from "./auth-provider";
import { AdminSecurityDialog, recoveryCodesErrorMessage } from "./admin-security-dialog";
import { ApiError } from "@/lib/api/errors";

const services = vi.hoisted(() => ({
  useRegenerateRecoveryCodes: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  useRegenerateRecoveryCodes: services.useRegenerateRecoveryCodes,
}));

vi.mock("@/features/auth/sudo", () => ({
  clearSudoWindow: vi.fn(),
  openSudoWindow: vi.fn().mockResolvedValue({
    expiresAt: "2026-08-02T00:00:00Z",
    expiresAtMs: Date.now() + 300_000,
    expiresInSeconds: 300,
  }),
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

const CODES = ["ABCDE-FGHJK", "LMNOP-QRSTU"];

function renderDialog() {
  const mutateAsync = vi.fn().mockResolvedValue({ recoveryCodes: CODES });
  const onOpenChange = vi.fn();
  services.useRegenerateRecoveryCodes.mockReturnValue({ mutateAsync, isPending: false });
  render(<AdminSecurityDialog open onOpenChange={onOpenChange} session={SESSION} />);
  return { mutateAsync, onOpenChange };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminSecurityDialog (ADM-112)", () => {
  it("shows the current 2FA state and enrollment date", () => {
    renderDialog();

    expect(screen.getByText("Enabled")).toBeDefined();
    expect(screen.getByText("2 Aug 2026")).toBeDefined();
    expect(screen.getByRole("button", { name: "Regenerate recovery codes" })).toBeDefined();
  });

  it("requires sudo and displays regenerated codes only until acknowledgement", async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValueOnce(new ApiError({ status: 403, rawCode: "ADMIN_SUDO_REQUIRED" }))
      .mockResolvedValueOnce({ recoveryCodes: CODES });
    services.useRegenerateRecoveryCodes.mockReturnValue({ mutateAsync, isPending: false });
    const onOpenChange = vi.fn();
    render(<AdminSecurityDialog open onOpenChange={onOpenChange} session={SESSION} />);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate recovery codes" }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate codes" }));

    expect(await screen.findByText("Additional verification required")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Authenticator code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Save these now — they are shown once")).toBeDefined();
    expect(screen.getByText(CODES[0])).toBeDefined();

    fireEvent.click(screen.getByLabelText(/I have saved these codes/i));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.queryByText(CODES[0])).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("maps safe recovery-code errors without exposing server details", () => {
    expect(
      recoveryCodesErrorMessage(new ApiError({ status: 403, rawCode: "ADMIN_MFA_NOT_ENROLLED" })),
    ).toMatch(/not enrolled/i);
    expect(
      recoveryCodesErrorMessage(new ApiError({ status: 0, rawCode: "UNKNOWN" })),
    ).toMatch(/authentication service is unavailable/i);
  });
});
