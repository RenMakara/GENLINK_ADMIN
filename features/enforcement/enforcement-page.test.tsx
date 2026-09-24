// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PageResponse } from "@/lib/api/types";
import type { AdminUserSanction } from "@/types/admin-sanction";

import { EnforcementPage } from "./enforcement-page";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: "",
}));

const permissionState = vi.hoisted(() => ({
  canLift: true,
}));

const queryState = vi.hoisted(() => ({
  value: {
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null as unknown,
    data: undefined as PageResponse<AdminUserSanction> | undefined,
    refetch: vi.fn(),
  },
  args: [] as Array<Record<string, unknown>>,
}));

const liftState = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue(undefined),
  pending: false,
  pendingSanctionId: null as string | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/enforcement",
  useRouter: () => ({
    push: navigation.push,
    replace: (href: string, options: unknown) => {
      navigation.replace(href, options);
      navigation.search = new URL(href, "https://admin.test").search.slice(1);
    },
  }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    permissions: permissionState.canLift ? ["user:warn", "user:unban"] : ["user:warn"],
    ready: true,
    has: (permission: string) => permission === "user:warn" || (permission === "user:unban" && permissionState.canLift),
    hasAll: () => permissionState.canLift,
    hasAny: () => true,
  }),
}));

vi.mock("@/services/sanctions", () => ({
  useAdminSanctions: (query: Record<string, unknown>) => {
    queryState.args.push(query);
    return queryState.value;
  },
}));

vi.mock("@/hooks/use-sanction-lift", () => ({
  useSanctionLift: () => liftState,
}));

function page(content: AdminUserSanction[], overrides: Partial<PageResponse<AdminUserSanction>> = {}): PageResponse<AdminUserSanction> {
  return {
    content,
    page: 0,
    size: 25,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    hasNext: false,
    ...overrides,
  };
}

function makeSanction(overrides: Partial<AdminUserSanction> = {}): AdminUserSanction {
  return {
    sanctionId: "sanction-1",
    userId: "user-1",
    userFullName: "Dara Sok",
    type: "BAN",
    severity: "HIGH",
    reason: "Repeated abuse of the community rules",
    messageEn: "Please review the community guidelines.",
    messageKm: "សូមពិនិត្យគោលការណ៍សហគមន៍។",
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
  queryState.value.isFetching = false;
  queryState.value.isError = false;
  queryState.value.error = null;
  queryState.value.data = undefined;
  queryState.value.refetch.mockClear();
  queryState.args = [];
  permissionState.canLift = true;
  liftState.execute.mockClear();
  liftState.pending = false;
  liftState.pendingSanctionId = null;
  navigation.push.mockClear();
  navigation.replace.mockClear();
  navigation.search = "";
});

describe("EnforcementPage (ADM-097)", () => {
  it("renders the global records and links each user to the detail Enforcement tab", () => {
    queryState.value.data = page([makeSanction()]);

    render(<EnforcementPage />);

    expect(screen.getByRole("heading", { name: "Enforcement" })).toBeDefined();
    expect(screen.getByRole("table", { name: "Global enforcement records" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Dara Sok" }).getAttribute("href")).toBe(
      "/users/user-1?tab=enforcement",
    );
    expect(screen.getByText("Ban")).toBeDefined();
    expect(screen.getByText("High")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByRole("button", { name: "Lift ban for Dara Sok" })).toBeDefined();
    expect(queryState.args.at(-1)).toEqual({ page: 0, size: 25 });
  });

  it("syncs type and active-only filters to the URL and backend query", () => {
    queryState.value.data = page([makeSanction()]);
    const view = render(<EnforcementPage />);

    fireEvent.click(screen.getByRole("button", { name: "Type filter" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Ban" }));
    expect(navigation.replace).toHaveBeenCalledWith(
      "/enforcement?type=BAN",
      { scroll: false },
    );

    view.rerender(<EnforcementPage />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Active only" }));
    expect(navigation.replace).toHaveBeenLastCalledWith(
      "/enforcement?type=BAN&activeOnly=true",
      { scroll: false },
    );
  });

  it("hides lifting without user:unban and keeps errors safe", () => {
    permissionState.canLift = false;
    queryState.value.data = page([makeSanction()]);
    render(<EnforcementPage />);
    expect(screen.queryByRole("button", { name: "Lift ban for Dara Sok" })).toBeNull();

    cleanup();
    queryState.value.data = undefined;
    queryState.value.isError = true;
    queryState.value.error = new Error("internal database details");
    render(<EnforcementPage />);
    expect(screen.getByText("We could not load enforcement records right now. Please try again.")).toBeDefined();
    expect(screen.queryByText("internal database details")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(queryState.value.refetch).toHaveBeenCalledOnce();
  });

  it("distinguishes an empty filtered result", () => {
    queryState.value.data = page([]);
    render(<EnforcementPage />);

    expect(screen.getByText("No enforcement records")).toBeDefined();
  });
});
