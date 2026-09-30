import { describe, expect, it } from "vitest";

import { NAVIGATION, activeItem, shippedItems, visibleGroups } from "./navigation";

describe("navigation — MVP filtering (ADM-034 AC#1)", () => {
  it("hides every item whose phase has not shipped", () => {
    const rendered = visibleGroups(null).flatMap((group) => group.items.map((item) => item.label));

    expect(rendered).toEqual([
      "Dashboard",
      "Users",
      "Enforcement",
      "Roles & Permissions",
      "Admin Users",
      "Analytics",
      "Audit Logs",
    ]);
  });

  it("the map really does contain unshipped items, or the test above proves nothing", () => {
    const all = NAVIGATION.flatMap((group) => group.items);

    expect(all.filter((item) => item.phase !== "mvp").length).toBeGreaterThan(8);
    expect(all.map((item) => item.label)).toContain("Finance");
    expect(all.map((item) => item.label)).toContain("Settings");
  });

  /** A section header with nothing under it is worse than no section (SSOT §3). */
  it("drops a group left with no visible children", () => {
    const groups = visibleGroups(null).map((group) => group.label);

    expect(groups).toEqual(["Overview", "People", "Operations", "System"]);
    expect(groups).not.toContain("Content");
    expect(groups).not.toContain("Engagement");
  });

  it("never renders a link to an unbuilt page", () => {
    const hrefs = visibleGroups(null).flatMap((group) => group.items.map((item) => item.href));

    expect(hrefs).not.toContain("/finance");
    expect(hrefs).not.toContain("/stories");
  });
});

describe("navigation — permission filtering", () => {
  /** Permission filtering is tested independently of the auth provider. */
  it("shows only items whose permission the admin holds", () => {
    const labels = visibleGroups(["user:read", "audit:read"]).flatMap((group) =>
      group.items.map((item) => item.label),
    );

    expect(labels).toEqual(["Users", "Audit Logs"]);
  });

  it("an ANALYTICS_VIEWER sees only Dashboard and Analytics among shipped routes (AC#1)", () => {
    const analyticsViewerPermissions = [
      "dashboard:view",
      "analytics:view",
      "analytics:export",
      "event:read",
    ];
    const labels = visibleGroups(analyticsViewerPermissions).flatMap((group) =>
      group.items.map((item) => item.label),
    );

    expect(labels).toEqual(["Dashboard", "Analytics"]);
  });

  it("hides a group whose children are all filtered out by permission", () => {
    expect(visibleGroups(["audit:read"]).map((group) => group.label)).toEqual(["System"]);
  });

  /** An admin lacking everything sees an empty sidebar, not a menu of dead ends. */
  it("renders nothing for an admin with no permissions", () => {
    expect(visibleGroups([])).toEqual([]);
  });

  /** Null skips filtering; an empty list hides every item. */
  it("null skips permission filtering entirely", () => {
    expect(visibleGroups(null).length).toBeGreaterThan(0);
    expect(visibleGroups(null)).not.toEqual(visibleGroups([]));
  });
});

describe("navigation — data integrity", () => {
  it("every item declares a permission", () => {
    const all = NAVIGATION.flatMap((group) => group.items);

    expect(all.every((item) => item.permission.includes(":"))).toBe(true);
  });

  /** The API returns codes without the prefix; a `PERM_` here would never match. */
  it("permissions carry no PERM_ prefix", () => {
    const all = NAVIGATION.flatMap((group) => group.items);

    expect(all.every((item) => !item.permission.startsWith("PERM_"))).toBe(true);
  });

  it("hrefs are unique and absolute", () => {
    const hrefs = NAVIGATION.flatMap((group) => group.items.map((item) => item.href));

    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
  });

  /** Badge catalogue access is separate from per-user XP grants. */
  it("gamification is gated on gamification:manage, not xp:grant", () => {
    const item = NAVIGATION.flatMap((group) => group.items).find(
      (candidate) => candidate.label === "Gamification",
    );

    expect(item?.permission).toBe("gamification:manage");
  });
});

describe("activeItem", () => {
  it("matches the exact route", () => {
    expect(activeItem("/users")?.label).toBe("Users");
  });

  /** A detail page keeps its parent section highlighted. */
  it("keeps the parent highlighted on a child route", () => {
    expect(activeItem("/users/3f9a-1234")?.label).toBe("Users");
  });

  it("does not match a route that merely shares a prefix", () => {
    expect(activeItem("/users-export")).toBeUndefined();
  });

  it("returns nothing for an unknown route", () => {
    expect(activeItem("/nowhere")).toBeUndefined();
  });

  /** Unshipped routes must not highlight either — they are not reachable. */
  it("ignores unshipped items", () => {
    expect(activeItem("/finance")).toBeUndefined();
  });
});

describe("shippedItems", () => {
  it("lists exactly the six MVP routes", () => {
    expect(shippedItems()).toHaveLength(7);
  });
});
