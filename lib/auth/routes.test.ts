import { describe, expect, it } from "vitest";

import { NAVIGATION } from "@/config/navigation";
import {
  DEFAULT_ROUTE,
  isProtectedRoute,
  isPublicRoute,
  LOGIN_ROUTE,
  loginUrlFor,
  returnToFrom,
  safeReturnTo,
  withReturnTo,
} from "@/lib/auth/routes";

/** Tests route protection and safe return-to redirects. */

describe("classification", () => {
  it.each(["/", "/login", "/mfa", "/enrol"])("%s is public", (path) => {
    expect(isPublicRoute(path)).toBe(true);
    expect(isProtectedRoute(path)).toBe(false);
  });

  it.each(["/dashboard", "/users", "/users/123", "/audit-logs", "/roles"])(
    "%s is protected",
    (path) => {
      expect(isProtectedRoute(path)).toBe(true);
    },
  );

  /** Nested public routes remain accessible. */
  it("covers paths nested under a public route", () => {
    expect(isPublicRoute("/enrol/confirm")).toBe(true);
  });

  /** Prefix lookalikes such as `/loginhistory` remain protected. */
  it("does not treat a longer name as a public route", () => {
    expect(isProtectedRoute("/loginhistory")).toBe(true);
    expect(isProtectedRoute("/enrolments")).toBe(true);
  });

  /** Sidebar routes remain protected by default. */
  it("protects every route in the sidebar", () => {
    for (const group of NAVIGATION) {
      for (const item of group.items) {
        expect(isProtectedRoute(item.href), item.href).toBe(true);
      }
    }
  });
});

describe("safeReturnTo", () => {
  it.each(["/users", "/users/123", "/audit-logs?page=2", "/users/123?tab=activity"])(
    "keeps %s",
    (path) => {
      expect(safeReturnTo(path)).toBe(path);
    },
  );

  it.each([null, undefined, ""])("falls back for %o", (value) => {
    expect(safeReturnTo(value)).toBe(DEFAULT_ROUTE);
  });

  /** Rejects return paths that could redirect to another origin. */
  it.each([
    ["absolute http", "https://evil.example/users"],
    ["protocol-relative", "//evil.example/users"],
    ["protocol-relative with credentials", "//user:pass@evil.example"],
    ["backslash instead of slash", "/\\evil.example"],
    ["backslash pair", "/\\\\evil.example"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["no leading slash", "users"],
    ["a bare host", "evil.example"],
  ])("refuses %s", (_label, value) => {
    expect(safeReturnTo(value)).toBe(DEFAULT_ROUTE);
  });

  /** A newline can split a `Location` header, and a NUL can truncate the checks above. */
  it.each([
    ["newline", "/users\nLocation: https://evil.example"],
    ["carriage return", "/users\r\nSet-Cookie: x=1"],
    ["NUL", `/users${String.fromCharCode(0x00)}`],
    ["DEL", `/users${String.fromCharCode(0x7f)}`],
    ["vertical tab", `/users${String.fromCharCode(0x0b)}`],
  ])("refuses an embedded %s", (_label, value) => {
    expect(safeReturnTo(value)).toBe(DEFAULT_ROUTE);
  });

  /**
   * `/foo/../users` resolves back inside the site, so it is safe — but it must come back
   * *normalised* rather than as written, or the same page is reachable under two different URLs.
   */
  it("normalises a path that resolves back inside the site", () => {
    expect(safeReturnTo("/foo/../users")).toBe("/users");
  });

  /**
   * Two shapes that look like attacks and are not. Both were asserted as refusals while writing
   * this and both were wrong, which is exactly why they are pinned as accepted — the next person
   * to read the list will have the same instinct.
   *
   * <ul>
   *   <li>`/javascript:alert(1)` is a *path*, not a scheme. The leading slash settles it: the
   *       browser navigates to a page of that name and gets a 404. The scheme form without the
   *       slash is refused above, and that is the one that matters.</li>
   *   <li>`..` cannot climb above the root. `/../../evil.example` resolves to the same-origin
   *       path `/evil.example` — a 404 on this site, not a trip to someone else's.</li>
   * </ul>
   *
   * <p>Refusing them anyway would cost nothing here, but the rule would be "reject things that
   * pattern-match as scary", which is the kind of check that gets loosened later by someone who
   * cannot tell which cases it was actually load-bearing for.
   */
  it.each([
    ["/javascript:alert(1)", "/javascript:alert(1)"],
    ["/../../evil.example", "/evil.example"],
  ])("treats %s as the same-origin path it is", (value, expected) => {
    expect(safeReturnTo(value)).toBe(expected);
  });

  /** Not an attack, just a loop: signing in to arrive back at sign-in. */
  it.each(["/login", "/mfa", "/enrol"])("refuses %s as a destination", (path) => {
    expect(safeReturnTo(path)).toBe(DEFAULT_ROUTE);
  });

  /** A fragment never reaches the server, so dropping it is correct rather than lossy. */
  it("drops a fragment", () => {
    expect(safeReturnTo("/users#section")).toBe("/users");
  });
});

describe("loginUrlFor", () => {
  /** AC#1: the destination survives the bounce to sign-in. */
  it("remembers where the visitor was going", () => {
    expect(loginUrlFor("/users")).toBe("/login?next=%2Fusers");
  });

  it("keeps the query string of the intended page", () => {
    expect(loginUrlFor("/users", "?status=banned")).toBe("/login?next=%2Fusers%3Fstatus%3Dbanned");
  });

  /** The ordinary case stays clean rather than round-tripping the default through a parameter. */
  it("omits the destination when it is the default", () => {
    expect(loginUrlFor(DEFAULT_ROUTE)).toBe(LOGIN_ROUTE);
  });

  it("omits it for a public route, which would loop", () => {
    expect(loginUrlFor("/mfa")).toBe(LOGIN_ROUTE);
  });
});

describe("returnToFrom", () => {
  it("reads the destination back out", () => {
    expect(returnToFrom("?next=%2Fusers")).toBe("/users");
  });

  it("reads back a destination that carried its own query", () => {
    expect(returnToFrom("?next=%2Fusers%3Fstatus%3Dbanned")).toBe("/users?status=banned");
  });

  it.each(["", "?", "?other=1"])("falls back when %o carries no destination", (search) => {
    expect(returnToFrom(search)).toBe(DEFAULT_ROUTE);
  });

  /**
   * The second half of the defence. The parameter reached this page through a URL the visitor
   * can retype, so validating it only when it was *written* would protect nothing.
   */
  it("refuses a hostile value on the way out too", () => {
    expect(returnToFrom("?next=https%3A%2F%2Fevil.example")).toBe(DEFAULT_ROUTE);
    expect(returnToFrom("?next=%2F%2Fevil.example")).toBe(DEFAULT_ROUTE);
  });
});

describe("the full round trip", () => {
  /**
   * What AC#1 actually describes, end to end: intercepted at `/users`, bounced to sign-in,
   * carried across the code step, and returned to `/users`.
   */
  it("returns the admin to the page they asked for", () => {
    const loginUrl = loginUrlFor("/users/8f3a?tab=activity");
    const search = loginUrl.slice(loginUrl.indexOf("?"));

    const carried = withReturnTo("/mfa", returnToFrom(search));
    const landing = returnToFrom(carried.slice(carried.indexOf("?")));

    expect(landing).toBe("/users/8f3a?tab=activity");
  });

  it("lands on the dashboard when nothing was remembered", () => {
    expect(returnToFrom(withReturnTo("/mfa", returnToFrom("")).slice(4))).toBe(DEFAULT_ROUTE);
  });
});
