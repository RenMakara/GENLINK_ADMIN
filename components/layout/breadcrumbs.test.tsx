// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Breadcrumbs } from "./breadcrumbs";

const userDetail = vi.hoisted(() => ({ data: { fullName: "Dara Sok" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/users/397939ea-0e71-4bb5-9b4a-3d2707296630",
}));

vi.mock("@/services/users", () => ({
  useUserDetail: () => userDetail,
}));

afterEach(() => {
  cleanup();
});

describe("Breadcrumbs user detail label (ADM-073)", () => {
  it("uses the loaded user's name instead of the UUID", () => {
    render(<Breadcrumbs />);

    expect(screen.getByText("Dara Sok")).toBeDefined();
    expect(screen.queryByText("397939ea")).toBeNull();
  });
});
