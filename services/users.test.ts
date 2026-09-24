import { describe, expect, it } from "vitest";

import {
  DEFAULT_USER_TABLE_SORTING,
  USER_TABLE_SORTABLE_COLUMN_IDS,
} from "@/features/users/user-table-columns";
import { createDefaultUserFilters } from "@/features/users/user-filters";

import { buildUserExportQuery, buildUserListQuery, buildUserSearchQuery } from "./users";

describe("buildUserListQuery (ADM-072)", () => {
  it("maps URL-owned table state to the documented list query", () => {
    const filters = createDefaultUserFilters();
    filters.status = ["ACTIVE", "PENDING"];
    filters.emailVerified = "VERIFIED";
    filters.levelMin = 3;
    filters.xpMax = 5000;
    filters.createdFrom = "2026-09-01";
    filters.banned = true;
    filters.includeDeleted = true;

    expect(
      buildUserListQuery({
        search: "  dara  ",
        filters,
        sorting: [{ id: "lastActiveAt", desc: true }],
        pageIndex: 2,
        pageSize: 50,
      }),
    ).toEqual({
      page: 2,
      size: 50,
      q: "dara",
      sort: ["lastActiveAt,desc"],
      status: "ACTIVE,PENDING",
      emailVerified: "true",
      levelMin: "3",
      xpMax: "5000",
      createdFrom: "2026-09-01",
      banned: "true",
      includeDeleted: "true",
    });
  });

  it("keeps the default sort and omits inactive filters only when the page supplies them", () => {
    expect(USER_TABLE_SORTABLE_COLUMN_IDS).toContain("createdAt");
    expect(DEFAULT_USER_TABLE_SORTING).toEqual([{ id: "createdAt", desc: true }]);

    expect(
      buildUserListQuery({
        search: "",
        filters: createDefaultUserFilters(),
        sorting: DEFAULT_USER_TABLE_SORTING,
        pageIndex: 0,
        pageSize: 25,
      }),
    ).toEqual({ page: 0, size: 25, sort: ["createdAt,desc"] });
  });
});

describe("buildUserSearchQuery (ADM-076)", () => {
  it("uses the fixed five-result page required by the command palette", () => {
    expect(buildUserSearchQuery("  dara@example.com  ")).toEqual({
      q: "dara@example.com",
      page: 0,
      size: 5,
    });
  });
});

describe("buildUserExportQuery (ADM-099)", () => {
  it("reuses the active filters and sort without exporting only the current page", () => {
    const filters = createDefaultUserFilters();
    filters.status = ["ACTIVE"];
    filters.includeDeleted = true;

    expect(
      buildUserExportQuery({
        search: "  dara  ",
        filters,
        sorting: [{ id: "createdAt", desc: true }],
        pageIndex: 4,
        pageSize: 100,
      }),
    ).toEqual({
      q: "dara",
      sort: ["createdAt,desc"],
      status: "ACTIVE",
      includeDeleted: "true",
    });
  });
});
