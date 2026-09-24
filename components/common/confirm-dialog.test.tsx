// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { ConfirmDialog } from "./confirm-dialog";

afterEach(() => {
  cleanup();
});

function renderDialog(
  props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {},
) {
  return render(
    <ConfirmDialog
      open
      onOpenChange={vi.fn()}
      title="Ban this user?"
      description="The account will lose access."
      consequence="This prevents sign-in and keeps the account and its content."
      confirmLabel="Ban user"
      onConfirm={vi.fn()}
      {...props}
    />,
  );
}

describe("ConfirmDialog (ADM-088)", () => {
  it("renders the exact consequence in an inline alert and focuses Cancel", () => {
    renderDialog();

    expect(screen.getByRole("alert")).toBeDefined();
    expect(
      screen.getByText("This prevents sign-in and keeps the account and its content."),
    ).toBeDefined();

    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(document.activeElement).toBe(cancel);
  });

  it("blocks a medium-tier action with a specific under-10-character reason message", () => {
    const onConfirm = vi.fn();
    renderDialog({ tier: "medium", onConfirm });

    const confirm = screen.getByRole("button", { name: "Ban user" });
    const reason = screen.getByLabelText("Reason");

    expect(confirm).toHaveProperty("disabled", true);
    fireEvent.change(reason, { target: { value: "too short" } });
    expect(screen.getByText(/at least 10 characters/i)).toBeDefined();
    expect(confirm).toHaveProperty("disabled", true);

    fireEvent.change(reason, { target: { value: "Reviewed and confirmed by support" } });
    expect(confirm).toHaveProperty("disabled", false);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith("Reviewed and confirmed by support");
  });

  it("requires an exact target match for high-tier actions", () => {
    renderDialog({
      tier: "high",
      confirmTarget: "dara.sok",
      confirmTargetLabel: "username",
    });

    const reason = screen.getByLabelText("Reason");
    const target = screen.getByLabelText(/Type the username/i);
    const confirm = screen.getByRole("button", { name: "Ban user" });

    fireEvent.change(reason, { target: { value: "Reviewed duplicate account" } });
    fireEvent.change(target, { target: { value: "Dara.Sok" } });
    expect(confirm).toHaveProperty("disabled", true);

    fireEvent.change(target, { target: { value: "dara.sok" } });
    expect(confirm).toHaveProperty("disabled", false);
  });

  it("prompts for sudo inline and retries the original action after re-authentication", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new ApiError({ status: 403, rawCode: "ADMIN_SUDO_REQUIRED" }))
      .mockResolvedValueOnce(undefined);
    const onSudoReauthenticate = vi.fn().mockResolvedValue(undefined);

    renderDialog({
      tier: "high",
      confirmTarget: "dara.sok",
      confirmTargetLabel: "username",
      onConfirm,
      onSudoReauthenticate,
    });

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Reviewed duplicate account" },
    });
    fireEvent.change(screen.getByLabelText(/Type the username/i), {
      target: { value: "dara.sok" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));

    expect(await screen.findByText("Additional verification required")).toBeDefined();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Authenticator code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    await waitFor(() => {
      expect(onSudoReauthenticate).toHaveBeenCalledWith({ code: "123456" });
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });
  });
});
