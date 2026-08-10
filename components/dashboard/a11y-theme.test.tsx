// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { QuickActionsPanel } from "./quick-actions-panel";

// Mock matchMedia for testing prefers-reduced-motion (AC#3)
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function TestReducedMotionComponent() {
  const reduced = useReducedMotion();
  return <div data-testid="motion-state">{reduced ? "reduced" : "normal"}</div>;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Phase 2 Accessibility & Theme (ADM-058)", () => {
  it("detects prefers-reduced-motion OS preference (AC#3)", () => {
    mockMatchMedia(true);

    render(<TestReducedMotionComponent />);

    expect(screen.getByTestId("motion-state").textContent).toBe("reduced");
  });

  it("ensures interactive quick action links carry focus-visible ring styles (AC#1)", () => {
    render(<QuickActionsPanel userPermissions={["user:read", "user:export"]} />);

    const searchLink = screen.getByRole("link", { name: /Search user/i });
    expect(searchLink.className).toContain("focus-visible:ring-2");
    expect(searchLink.className).toContain("focus-visible:ring-ring");
  });
});
