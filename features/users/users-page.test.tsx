// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { UsersPage } from "./users-page";
import type { AdminUserTableRow } from "./types";

const navigation = vi.hoisted(() => {
  let search = "";
  const push = vi.fn((href: string) => {
    search = new URL(href, "https://admin.test").search.slice(1);
  });

  return {
    push,
    getSearch: () => search,
    setSearch: (nextSearch: string) => {
      search = nextSearch;
    },
    reset: () => {
      search = "";
      push.mockClear();
    },
  };
});

const service = vi.hoisted(() => ({
  useUserList: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/users",
  useRouter: () => ({ push: navigation.push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navigation.getSearch()),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    has: (permission: string) => permission === "user:export" || permission === "user:export:pii",
  }),
}));

vi.mock("@/services/users", async () => {
  const actual = await vi.importActual<typeof import("@/services/users")>("@/services/users");
  return { ...actual, useUserList: service.useUserList };
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

const USER: AdminUserTableRow = {
  userId: "user-1",
  fullName: "Morm Rotana",
  username: "morm.rotana",
  email: "morm.rotana@example.com",
  avatarUrl: null,
  emailVerified: true,
  accountStatus: "ACTIVE",
  adminRoleName: null,
  universityName: "Royal University of Phnom Penh",
  workStatus: "YOUNG_PROFESSIONAL",
  level: 7,
  totalXp: 1240,
  createdAt: "2026-06-23T00:00:00.000Z",
  lastActiveAt: "2026-09-22T00:00:00.000Z",
};

const refetch = vi.fn();

function successQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      content: [USER],
      page: 0,
      size: 25,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  navigation.reset();
});

describe("UsersPage (ADM-072)", () => {
  it("renders the live-list composition and maps shared URL state to the query", () => {
    service.useUserList.mockReturnValue(successQuery());
    navigation.setSearch("q=alice&page=2&size=50&status=PENDING");

    render(<UsersPage />);

    expect(screen.getByRole("heading", { name: "Users" })).toBeDefined();
    expect(
      (screen.getByRole("searchbox", { name: "Search users" }) as HTMLInputElement).value,
    ).toBe("alice");
    expect(screen.getByText("Morm Rotana")).toBeDefined();
    expect(service.useUserList).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "alice",
        page: 1,
        size: 50,
        status: "PENDING",
        sort: ["createdAt,desc"],
      }),
    );
  });

  it("renders a safe error state with a retry action", () => {
    service.useUserList.mockReturnValue(
      successQuery({
        data: undefined,
        isError: true,
        error: new ApiError({ status: 500, rawCode: "INTERNAL_SERVER_ERROR" }),
      }),
    );

    render(<UsersPage />);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("We could not load user records right now. Please try again.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("renders loading and empty states without treating them as errors", () => {
    service.useUserList.mockReturnValue(successQuery({ data: undefined, isLoading: true }));
    const view = render(<UsersPage />);

    expect(screen.getByRole("status", { name: "Loading Users" })).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();

    service.useUserList.mockReturnValue(
      successQuery({ data: { content: [], totalElements: 0, page: 0, size: 25, totalPages: 0, hasNext: false } }),
    );
    navigation.setSearch("q=missing&status=PENDING");
    view.rerender(<UsersPage />);

    expect(screen.getByText("No matching users")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
    expect(navigation.push).toHaveBeenCalledWith("/users", { scroll: false });
  });
});
