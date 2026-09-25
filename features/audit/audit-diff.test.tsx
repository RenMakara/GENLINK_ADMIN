// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditDiff, buildAuditDiff } from "./audit-diff";

describe("audit diff viewer (ADM-120)", () => {
  it("reports changed, added, and removed fields individually", () => {
    const entries = buildAuditDiff(
      { status: "ACTIVE", profile: { displayName: "Dara" }, removed: true },
      { status: "SUSPENDED", profile: { displayName: "Dara" }, added: "note" },
    );

    expect(entries).toEqual([
      { path: "$.added", before: expect.anything(), after: "note", kind: "added" },
      { path: "$.removed", before: true, after: expect.anything(), kind: "removed" },
      { path: "$.status", before: "ACTIVE", after: "SUSPENDED", kind: "changed" },
    ]);
  });

  it("renders a readable field table and does not dump the original objects", () => {
    render(
      <AuditDiff
        before={{ status: "ACTIVE", profile: { displayName: "Dara" } }}
        after={{ status: "SUSPENDED", profile: { displayName: "Dara" } }}
      />,
    );

    expect(screen.getByRole("table", { name: "Audit field changes" })).toBeDefined();
    expect(screen.getByText("$.status")).toBeDefined();
    expect(screen.getByText('"ACTIVE"')).toBeDefined();
    expect(screen.getByText('"SUSPENDED"')).toBeDefined();
    expect(screen.getByText("Changed")).toBeDefined();
    expect(screen.queryByText(/profile.*displayName/)).toBeNull();
  });

  it("states when there are no changed fields", () => {
    render(<AuditDiff before={{ status: "ACTIVE" }} after={{ status: "ACTIVE" }} />);
    expect(screen.getByText("No changed fields recorded.")).toBeDefined();
  });
});

