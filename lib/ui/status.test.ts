import { describe, expect, it } from "vitest";

import {
  isUserStatus,
  statusPresentation,
  USER_STATUSES,
  type UserStatus,
} from "@/lib/ui/status";

/** Every status remains identifiable through its text label. */

describe("status presentation", () => {
  /** AC#1, stated directly: every status carries a word. */
  it.each(USER_STATUSES)("gives %s a non-empty label", (status) => {
    expect(statusPresentation(status).label.trim().length).toBeGreaterThan(0);
  });

  /** No two statuses share a label, or the text would stop distinguishing them. */
  it("labels every status distinctly", () => {
    const labels = USER_STATUSES.map((s) => statusPresentation(s).label);
    expect(new Set(labels).size).toBe(USER_STATUSES.length);
  });

  /** Pin the semantic colors used for each status. */
  it.each([
    ["ACTIVE", "Active", "success"],
    ["PENDING", "Pending", "secondary"],
    ["SUSPENDED", "Suspended", "warning"],
    ["BANNED", "Banned", "destructive"],
    ["DELETED", "Deleted", "muted"],
  ] as const)("draws %s as %s on %s", (status, label, token) => {
    const p = statusPresentation(status);
    expect(p.label).toBe(label);
    expect(p.className).toContain(`bg-${token}`);
  });

  /**
   * Only tokens the contrast gate checks may appear, or a badge could ship below AA without
   * `pnpm check:contrast` ever seeing it. This is the link between the two — the gate reads
   * globals.css, this asserts the component only draws from that verified set.
   */
  it("only uses contrast-checked fill tokens", () => {
    const allowed = ["bg-success", "bg-warning", "bg-destructive", "bg-secondary", "bg-muted"];
    for (const status of USER_STATUSES) {
      const fill = statusPresentation(status).className.match(/bg-[a-z]+/)?.[0];
      expect(allowed, status).toContain(fill);
    }
  });
});

describe("isUserStatus", () => {
  it.each(USER_STATUSES)("accepts %s", (status) => {
    expect(isUserStatus(status)).toBe(true);
  });

  it.each(["active", "Active", "banned ", "REMOVED", ""])("rejects %o", (value) => {
    expect(isUserStatus(value)).toBe(false);
  });
});

describe("an unknown status", () => {
  /**
   * A sixth status added on the backend must not crash a page full of user rows. It gets a
   * neutral pill labelled with whatever came through — still a word, so AC#1 holds even for a
   * value this build has never heard of.
   */
  it("falls back to a labelled neutral pill rather than throwing", () => {
    const p = statusPresentation("ARCHIVED" as UserStatus);
    expect(p.label).toBe("ARCHIVED");
    expect(p.className).toContain("bg-muted");
  });

  it("labels an empty value rather than rendering a blank pill", () => {
    expect(statusPresentation("").label).toBe("Unknown");
  });
});
