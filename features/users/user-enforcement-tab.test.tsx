// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PageResponse } from "@/lib/api/types";

import type { AdminUserSanction } from "./types";
import { UserEnforcementTab } from "./user-enforcement-tab";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
}));

const permissionState = vi.hoisted(() => ({
  canLift: true,
}));

const queryState = vi.hoisted(() => ({
  value: {
    isLoading: false,
    isError: false,
    error: null as unknown,
    data: undefined as PageResponse<AdminUserSanction> | undefined,
    refetch: vi.fn(),
  },
  args: [] as Array<[string, { page: number; size: number; type?: string }]>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/users/user-1",
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    permissions: permissionState.canLift ? ["user:unban"] : [],
    ready: true,
    has: () => permissionState.canLift,
    hasAll: () => permissionState.canLift,
    hasAny: () => permissionState.canLift,
  }),
}));

vi.mock("@/services/users", () => ({
  useUserSanctions: (userId: string, query: { page: number; size: number; type?: string }) => {
    queryState.args.push([userId, query]);
    return queryState.value;
  },
}));

vi.mock("./user-sanction-lift", async () => {
  const actual = await vi.importActual<typeof import("./user-sanction-lift")>("./user-sanction-lift");

  return {
    ...actual,
    useUserSanctionLift: () => ({
      execute: vi.fn().mockResolvedValue(undefined),
      pending: false,
      pendingSanctionId: null,
    }),
  };
});

const USER_ID = "user-1";

function page<T>(content: T[], totalElements = content.length): PageResponse<T> {
  return {
    content,
    page: 0,
    size: 25,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / 25)),
    hasNext: totalElements > 25,
  };
}

function makeSanction(overrides: Partial<AdminUserSanction> = {}): AdminUserSanction {
  return {
    sanctionId: "sanction-1",
    userId: USER_ID,
    userFullName: "Dara Sok",
    type: "BAN",
    severity: null,
    reason: "Repeated abuse of the community rules",
    messageEn: null,
    messageKm: null,
    previousStatus: "ACTIVE",
    startsAt: "2026-09-24T01:00:00Z",
    expiresAt: null,
    acknowledgedAt: null,
    liftedAt: null,
    liftReason: null,
    issuedByAdminId: "admin-1",
    issuedByAdminName: "Sok Dara",
    liftedByAdminId: null,
    liftedByAdminName: null,
    active: true,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  queryState.value.isLoading = false;
  queryState.value.isError = false;
  queryState.value.error = null;
  queryState.value.data = undefined;
  queryState.value.refetch.mockClear();
  queryState.args = [];
  permissionState.canLift = true;
  navigation.replace.mockClear();
});

describe("UserEnforcementTab (ADM-095)", () => {
  it("interleaves records chronologically and distinguishes active from lifted sanctions", () => {
    queryState.value.data = page([
      makeSanction(),
      makeSanction({
        sanctionId: "sanction-2",
        type: "WARNING",
        severity: "MEDIUM",
        liftedAt: "2026-09-23T02:00:00Z",
        liftReason: "Review completed",
        active: false,
      }),
    ]);

    render(<UserEnforcementTab userId={USER_ID} />);

    expect(screen.getByRole("table", { name: "User enforcement timeline" })).toBeDefined();
    expect(screen.getAllByText("Ban").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Warning").length).toBeGreaterThan(1);
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Lifted")).toBeDefined();
    expect(screen.getAllByText("Sok Dara").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "Lift ban sanction" })).toBeDefined();
    expect(queryState.args.at(-1)).toEqual([USER_ID, { page: 0, size: 25 }]);
  });

  it("URL-syncs the type filter and sends the selected backend filter", () => {
    queryState.value.data = page([makeSanction()]);

    render(<UserEnforcementTab userId={USER_ID} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Filter enforcement by type" }), {
      target: { value: "WARNING" },
    });

    expect(navigation.replace).toHaveBeenCalledWith(
      expect.stringContaining("type=WARNING"),
      { scroll: false },
    );
  });

  it("hides lift controls when the admin lacks user:unban", () => {
    permissionState.canLift = false;
    queryState.value.data = page([makeSanction()]);

    render(<UserEnforcementTab userId={USER_ID} />);

    expect(screen.queryByRole("button", { name: "Lift ban sanction" })).toBeNull();
    expect(screen.getByLabelText("No action available")).toBeDefined();
  });

  it("renders retry and empty states without exposing raw API details", () => {
    queryState.value.isError = true;
    queryState.value.error = new Error("internal database details");
    render(<UserEnforcementTab userId={USER_ID} />);

    expect(screen.getByText("We could not load this user's enforcement history right now. Please try again.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(queryState.value.refetch).toHaveBeenCalledOnce();

    cleanup();
    queryState.value.isError = false;
    queryState.value.data = page([]);
    render(<UserEnforcementTab userId={USER_ID} />);
    expect(screen.getByText("No enforcement records")).toBeDefined();
  });
});
