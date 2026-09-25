// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { AnalyticsExportButton, analyticsExportSummary } from "./analytics-export";

const exportAnalyticsCsv = vi.hoisted(() => vi.fn());
const permissionState = vi.hoisted(() => ({ ready: true, canExport: true }));

vi.mock("@/services/analytics", () => ({ exportAnalyticsCsv }));
vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    ready: permissionState.ready,
    has: () => permissionState.canExport,
  }),
}));

const query = { from: "2026-08-01", to: "2026-08-31", granularity: "week" as const };

afterEach(() => {
  cleanup();
  exportAnalyticsCsv.mockReset();
  permissionState.ready = true;
  permissionState.canExport = true;
});

describe("analytics export UI (ADM-119)", () => {
  it("summarises the exact series, range, and grouping", () => {
    expect(analyticsExportSummary("User growth", query)).toEqual([
      "Series: User growth",
      "Range: 1 Aug 2026 to 31 Aug 2026",
      "Grouping: week",
    ]);
  });

  it("hides the export action without analytics:export", () => {
    permissionState.canExport = false;

    render(
      <AnalyticsExportButton series="user-growth" title="User growth" query={query} />,
    );

    expect(screen.queryByRole("button", { name: "Export User growth CSV" })).toBeNull();
  });

  it("requires a reason and downloads the selected series and range", async () => {
    exportAnalyticsCsv.mockResolvedValueOnce({
      blob: new Blob(["bucket,count\r\n2026-08-01,42\r\n"], { type: "text/csv" }),
      filename: "genlink-analytics-user-growth.csv",
    });
    const createObjectUrl = vi.fn(() => "blob:analytics");
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(
      <AnalyticsExportButton series="user-growth" title="User growth" query={query} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Export User growth CSV" }));
    expect(screen.getByRole("alertdialog")).toBeDefined();
    expect(screen.getByText("Range: 1 Aug 2026 to 31 Aug 2026")).toBeDefined();
    expect(screen.getByText("Grouping: week")).toBeDefined();
    expect((screen.getByRole("button", { name: "Download CSV" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Monthly analytics review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));

    await waitFor(() =>
      expect(exportAnalyticsCsv).toHaveBeenCalledWith({
        series: "user-growth",
        from: "2026-08-01",
        to: "2026-08-31",
        granularity: "week",
        reason: "Monthly analytics review",
      }),
    );
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:analytics");
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it("keeps raw API details out of the export error UI", async () => {
    exportAnalyticsCsv.mockRejectedValueOnce(
      new ApiError({ status: 403, rawCode: "FORBIDDEN", serverMessage: "internal permission detail" }),
    );

    render(
      <AnalyticsExportButton series="platforms" title="Platform usage" query={query} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Export Platform usage CSV" }));
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Monthly analytics review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));

    await waitFor(() => expect(screen.getByText("You do not have permission to export analytics.")).toBeDefined());
    expect(screen.queryByText("internal permission detail")).toBeNull();
  });
});
