// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminLandingPage } from "./admin-landing-page";

describe("AdminLandingPage", () => {
  it("renders the public navigation, hero, feature pillars, and app preview", () => {
    render(<AdminLandingPage />);

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Your next chapter starts here/i })).toBeDefined();
    expect(screen.getByRole("img", { name: "Angkor Wat at sunrise reflected in calm water" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Grow" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Learn" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Community" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Finance" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Opportunity" })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Technology with a human pulse/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Meet the GenLink team/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Ren Makara" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Heng Chansela" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Sokny Enat" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Chhaeng Sokuntheara" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Open Ren Makara's GitHub profile" }).getAttribute("href")).toBe(
      "https://github.com/RenMakara",
    );
    expect(screen.getAllByRole("link", { name: /Open .* GitHub profile/i })).toHaveLength(4);
    expect(screen.getAllByRole("link", { name: /Admin login/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /Admin login/i }).every((link) => link.getAttribute("href") === "/login")).toBe(true);
  });
});
