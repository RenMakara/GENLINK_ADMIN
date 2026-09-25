// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalyticsPage } from "./analytics-page";

const navigation = {
  search: "",
  replace: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/analytics",
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

afterEach(() => {
  cleanup();
  navigation.search = "";
  navigation.replace.mockClear();
});

describe("AnalyticsPage (ADM-117)", () => {
  it("restores range, granularity, and tab from the URL", () => {
    navigation.search = "range=7d&granularity=week&tab=audience";

    render(<AnalyticsPage />);

    expect(screen.getByRole("combobox", { name: "Date range" })).toHaveProperty("value", "7d");
    expect(screen.getByRole("combobox", { name: "Granularity" })).toHaveProperty("value", "week");
    expect(screen.getByRole("tab", { name: "Audience" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("analytics-tab-audience");
  });

  it("writes custom dates and granularity to the URL", () => {
    navigation.search = "range=custom&from=2026-08-01&to=2026-08-31";

    render(<AnalyticsPage />);

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-08-02" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Granularity" }), {
      target: { value: "month" },
    });

    expect(navigation.replace).toHaveBeenNthCalledWith(
      1,
      "/analytics?range=custom&from=2026-08-02&to=2026-08-31",
      { scroll: false },
    );
    expect(navigation.replace).toHaveBeenNthCalledWith(
      2,
      "/analytics?range=custom&from=2026-08-01&to=2026-08-31&granularity=month",
      { scroll: false },
    );
  });

  it("shows an accessible validation error when the custom range is reversed", () => {
    navigation.search = "range=custom&from=2026-09-10&to=2026-09-01";

    render(<AnalyticsPage />);

    expect(screen.getByText("The start date must be on or before the end date.")).toBeDefined();
    expect(screen.getByLabelText("From").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("To").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getAllByText(/Charts remain paused/).length).toBeGreaterThan(0);
  });

  it("supports keyboard tab navigation and visible focus classes", () => {
    render(<AnalyticsPage />);

    const overview = screen.getByRole("tab", { name: "Overview" });
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(navigation.replace).toHaveBeenCalledWith("/analytics?tab=audience", { scroll: false });
    expect(overview.className).toContain("focus-visible:ring-2");
    expect(screen.getByRole("tabpanel").getAttribute("tabindex")).toBe("0");
  });
});

