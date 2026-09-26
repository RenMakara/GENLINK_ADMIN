// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GenLinkLogo } from "./logo";

afterEach(() => {
  cleanup();
});

describe("GenLinkLogo", () => {
  it("renders logo images for light and dark modes with correct alt text", () => {
    render(<GenLinkLogo size="md" suffix="Admin" />);

    const imgs = screen.getAllByAltText("GenLink KH Logo");
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute("src")).toContain("genlink_logo_light.png");
    expect(imgs[1].getAttribute("src")).toContain("genlink_logo_dark.png");
    expect(screen.getByText("GenLink KH")).toBeDefined();
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("supports iconOnly mode", () => {
    render(<GenLinkLogo size="sm" iconOnly />);

    expect(screen.getAllByAltText("GenLink KH Logo")).toHaveLength(2);
    expect(screen.queryByText("GenLink KH")).toBeNull();
  });
});
