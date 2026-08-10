// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { KpiCardRow } from "./kpi-card-row";

afterEach(() => {
  cleanup();
});

describe("KpiCardRow (ADM-051)", () => {
  it("renders all seven KPI cards with doorway links (AC#1)", () => {
    render(<KpiCardRow />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(7);

    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/users");
    expect(hrefs).toContain("/users?status=ACTIVE");
    expect(hrefs).toContain("/users?created=today");
    expect(hrefs).toContain("/analytics");
    expect(hrefs).toContain("/users?status=PENDING");
    expect(hrefs).toContain("/users?status=BANNED");
  });

  it("visibly marks estimated metrics (DAU & MAU) with est. badge (AC#2)", () => {
    render(<KpiCardRow />);

    const badges = screen.getAllByText("est.");
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it("renders 7 loading skeletons holding layout without reflow (AC#3)", () => {
    render(<KpiCardRow loading />);

    const skeletons = screen.getAllByRole("status");
    expect(skeletons).toHaveLength(7);
  });

  it("applies tabular-nums class for numeric values (AC#4)", () => {
    const { container } = render(<KpiCardRow />);

    const tabularElements = container.querySelectorAll(".tabular-nums");
    expect(tabularElements.length).toBeGreaterThanOrEqual(7);
  });
});
