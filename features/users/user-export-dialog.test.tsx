// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { createDefaultUserFilters } from "./user-filters";
import { UserExportDialog, buildUserExportSummary } from "./user-export-dialog";

const exportUsersCsv = vi.hoisted(() => vi.fn());

vi.mock("@/services/users", async () => {
  const actual = await vi.importActual<typeof import("@/services/users")>("@/services/users");
  return { ...actual, exportUsersCsv };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UserExportDialog (ADM-099)", () => {
  it("summarises the current filter, row count, and masked PII state", () => {
    const filters = createDefaultUserFilters();
    filters.status = ["ACTIVE"];
    filters.levelMin = 5;
    filters.lastActive = "30d";

    render(
      <UserExportDialog
        open
        onOpenChange={vi.fn()}
        query={{ status: "ACTIVE", levelMin: "5", lastActive: "30d" }}
        filters={filters}
        search="dara"
        rowCount={1284}
        piiIncluded={false}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeDefined();
    expect(screen.getByText("Search: dara")).toBeDefined();
    expect(screen.getByText("Status: Active")).toBeDefined();
    expect(screen.getByText("Level: 5 to any")).toBeDefined();
    expect(screen.getByText("Last active: Last 30 days")).toBeDefined();
    expect(screen.getByText("1,284")).toBeDefined();
    expect(screen.getByText(/will be masked/)).toBeDefined();
    expect(screen.getByLabelText(/Type the confirmation phrase/)).toBeDefined();
    expect((screen.getByRole("button", { name: "Download CSV" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("downloads after the high-tier reason and phrase gates pass", async () => {
    exportUsersCsv.mockResolvedValueOnce({
      blob: new Blob(["userId\r\nu1\r\n"], { type: "text/csv" }),
      filename: "genlink-users.csv",
    });
    const createObjectUrl = vi.fn(() => "blob:test");
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(
      <UserExportDialog
        open
        onOpenChange={vi.fn()}
        query={{ status: "ACTIVE" }}
        filters={createDefaultUserFilters()}
        search=""
        rowCount={2}
        piiIncluded
      />,
    );

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Quarterly compliance review" },
    });
    fireEvent.change(screen.getByLabelText(/Type the confirmation phrase/), {
      target: { value: "EXPORT 2 USERS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));

    await waitFor(() => expect(exportUsersCsv).toHaveBeenCalledWith({ status: "ACTIVE" }, "Quarterly compliance review"));
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test");
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it("explains EXPORT_TOO_LARGE without showing the server message", async () => {
    exportUsersCsv.mockRejectedValueOnce(
      new ApiError({ status: 413, rawCode: "EXPORT_TOO_LARGE", serverMessage: "internal row count" }),
    );

    render(
      <UserExportDialog
        open
        onOpenChange={vi.fn()}
        query={{}}
        filters={createDefaultUserFilters()}
        search=""
        rowCount={60001}
        piiIncluded={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Quarterly compliance review" },
    });
    fireEvent.change(screen.getByLabelText(/Type the confirmation phrase/), {
      target: { value: "EXPORT 60001 USERS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));

    await waitFor(() => expect(screen.getByText(/more than 50,000 rows/)).toBeDefined());
    expect(screen.queryByText("internal row count")).toBeNull();
  });

  it("uses an explicit no-filter summary when the table is unfiltered", () => {
    expect(buildUserExportSummary("", createDefaultUserFilters())).toEqual(["All users (no filters)"]);
  });
});
