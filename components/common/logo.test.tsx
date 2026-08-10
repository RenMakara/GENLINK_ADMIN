// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GenLinkLogo } from "./logo";

afterEach(() => {
  cleanup();
});

describe("GenLinkLogo", () => {
  it("renders logo image with correct alt text", () => {
    render(<GenLinkLogo size="md" suffix="Admin" />);

    const img = screen.getByAltText("GenLink KH Logo");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toContain("genlink_logo.png");
    expect(screen.getByText("GenLink KH")).toBeDefined();
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("supports iconOnly mode", () => {
    render(<GenLinkLogo size="sm" iconOnly />);

    expect(screen.getByAltText("GenLink KH Logo")).toBeDefined();
    expect(screen.queryByText("GenLink KH")).toBeNull();
  });
});
