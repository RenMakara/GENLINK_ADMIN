import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NAVIGATION } from "@/config/navigation";
import { isPermission, PERMISSIONS, toPermissions, type Permission } from "@/types/permissions";

/**
 * ADM-038 — the permission union.
 *
 * <p>AC#1 (a typo is a compile error) is not asserted here, because a `expect()` cannot observe
 * a type error. It is enforced by the `@ts-expect-error` directives further down: `pnpm
 * typecheck` compiles this file, and an unused directive is itself an error — so if the union
 * ever widened to `string`, those lines would fail the build rather than pass silently.
 */

describe("the catalogue", () => {
  /**
   * SSOT §5.3 defines forty. Pinned as a number because the interesting failure is a *dropped*
   * code, and a test that only iterates whatever is in the array cannot see one go missing.
   */
  it("has all forty codes", () => {
    expect(PERMISSIONS).toHaveLength(40);
  });

  it("lists none of them twice", () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  /** `resource:action`, lower snake within a segment (SSOT §5.3). `user:export:pii` has three. */
  it("follows the resource:action shape", () => {
    for (const code of PERMISSIONS) {
      expect(code, code).toMatch(/^[a-z]+(?::[a-z_]+){1,2}$/);
    }
  });
});

describe("isPermission", () => {
  it("accepts every code in the catalogue", () => {
    for (const code of PERMISSIONS) {
      expect(isPermission(code), code).toBe(true);
    }
  });

  /**
   * The near-misses that a typo actually produces. `user:bann` is the one named in the task
   * description; the others are the plural, the prefixed authority, and the wrong case.
   */
  it.each(["user:bann", "user:bans", "PERM_user:ban", "USER_BAN", "user:ban ", ""])(
    "rejects %o",
    (value) => {
      expect(isPermission(value)).toBe(false);
    },
  );
});

describe("toPermissions", () => {
  /**
   * The API returns `string[]`. Unknown codes are dropped rather than thrown on: a backend
   * deployed ahead of this build sends a permission this bundle has never heard of, and the
   * right response is to ignore it, not to break every page that reads the session.
   */
  it("keeps what it knows and drops what it does not", () => {
    expect(toPermissions(["user:ban", "user:invented", "audit:read"])).toEqual([
      "user:ban",
      "audit:read",
    ]);
  });

  it("preserves the order the server sent", () => {
    expect(toPermissions(["audit:read", "user:ban"])).toEqual(["audit:read", "user:ban"]);
  });

  it("turns an empty list into an empty list", () => {
    expect(toPermissions([])).toEqual([]);
  });
});

describe("the nav gates", () => {
  /**
   * `NavItem.permission` is typed as {@link Permission}, so this cannot fail while the types
   * hold — which is the point. It fails if someone widens the field back to `string`, at which
   * moment a mistyped gate would start silently hiding a page from everyone.
   */
  it("only gate on codes in the catalogue", () => {
    for (const group of NAVIGATION) {
      for (const item of group.items) {
        expect(isPermission(item.permission), `${item.label} → ${item.permission}`).toBe(true);
      }
    }
  });
});

/**
 * The same forty codes live in `Permission.java` and in SSOT §5.3. Nothing enforces that at
 * build time — the two repositories compile separately — so this reads the enum directly when
 * it is on disk.
 *
 * <p>It is skipped rather than failed when the backend is not checked out beside this one, which
 * is the case in CI and in a frontend-only worktree. A skipped test guards nothing, so the count
 * above stays pinned independently: this catches drift on a developer machine, the pin catches
 * an edit anywhere.
 */
const BACKEND_ENUM = join(
  process.cwd(),
  "..",
  "backend/src/main/java/kh/edu/acleda/campuslink/modules/admin/rbac/Permission.java",
);

describe.skipIf(!existsSync(BACKEND_ENUM))("against the backend enum", () => {
  /** `USER_BAN("user:ban", "Ban a user permanently"),` → `user:ban`. */
  function backendCodes(): string[] {
    const source = readFileSync(BACKEND_ENUM, "utf8");
    return [...source.matchAll(/^\s{4}[A-Z][A-Z_]*\("([a-z][a-z_:]*)"/gm)].map((m) => m[1]);
  }

  /**
   * Compared as sets: the enum groups user enforcement before account recovery and SSOT §5.3
   * groups them the other way round. Ordering is a readability choice on each side, membership
   * is not.
   */
  it("agrees on exactly which permissions exist", () => {
    const backend = backendCodes();

    expect(backend.length).toBeGreaterThan(0); // the regex still matches the file's shape
    expect([...backend].sort()).toEqual([...PERMISSIONS].sort());
  });
});

/**
 * AC#1, enforced by the compiler rather than by an assertion.
 *
 * <p>Each directive below claims the line under it does not compile. TypeScript errors on a
 * `@ts-expect-error` that turns out to be unnecessary, so if `Permission` ever degraded to
 * `string` these would fail `pnpm typecheck` — the failure mode a runtime test cannot reach.
 */
function typosAreCompileErrors() {
  // @ts-expect-error — the typo from the ADM-038 description: an extra n.
  const typo: Permission = "user:bann";

  // @ts-expect-error — the authority form, which is what Spring sees, not what /me returns.
  const prefixed: Permission = "PERM_user:ban";

  // @ts-expect-error — an arbitrary string is not narrowable without isPermission().
  const arbitrary: Permission = String(1);

  const correct: Permission = "user:ban";

  return [typo, prefixed, arbitrary, correct];
}

describe("compile-time narrowing", () => {
  /**
   * The assertions above are static. This runs the function only so the file has no unused
   * export and the directives cannot be dropped as dead code by a future cleanup.
   */
  it("still admits the correctly spelled code", () => {
    expect(typosAreCompileErrors()).toContain("user:ban");
  });
});
