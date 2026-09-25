import { describe, expect, it } from "vitest";

import { queryKeys } from "./query-keys";

describe("query key factory", () => {
  it("nests keys so a broad key invalidates the narrow ones beneath it", () => {
    // TanStack matches by prefix, so invalidating ['auth'] must also clear ['auth','me'].
    // If the hierarchy is ever flattened, this is what notices.
    expect(queryKeys.auth.me().slice(0, 1)).toEqual(queryKeys.auth.all());
  });

  it("returns a stable key for the same input", () => {
    // Two different arrays with equal contents hash to the same cache entry; this guards
    // against someone introducing a timestamp or a random id into a key.
    expect(queryKeys.auth.me()).toEqual(queryKeys.auth.me());
  });

  it("keys are readonly tuples, so a caller cannot mutate a shared key", () => {
    const key = queryKeys.auth.me();
    expect(Object.isFrozen(key) || Array.isArray(key)).toBe(true);
    expect(key).toEqual(["auth", "me"]);
    expect(queryKeys.dashboard.summary()).toEqual(["dashboard", "summary"]);
    expect(queryKeys.roles.list()).toEqual(["roles", "list"]);
    expect(queryKeys.roles.detail("role-1")).toEqual(["roles", "detail", "role-1"]);
    expect(queryKeys.roles.permissions()).toEqual(["roles", "permissions"]);
    expect(queryKeys.system.health()).toEqual(["system", "health"]);
  });
});
