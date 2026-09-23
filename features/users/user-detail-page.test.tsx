// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { UserDetailPage } from "./user-detail-page";

const navigation = vi.hoisted(() => {
  let search = "";
  const push = vi.fn();
  const replace = vi.fn((href: string) => {
    search = new URL(href, "https://admin.test").search.slice(1);
  });

  return {
    push,
    replace,
    getSearch: () => search,
    setSearch: (nextSearch: string) => {
      search = nextSearch;
    },
    reset: () => {
      search = "";
      push.mockClear();
      replace.mockClear();
    },
  };
});

const userQuery = vi.hoisted(() => ({
  value: {
    isLoading: false,
    isError: false,
    error: null as unknown,
    data: {
      userId: "397939ea-0e71-4bb5-9b4a-3d2707296630",
      fullName: "Dara Sok",
      username: "dara.sok",
      avatarUrl: null,
      bio: null,
      dateOfBirth: null,
      gender: null,
      phoneNumber: null,
      location: "Phnom Penh",
      universityName: null,
      workStatus: null,
      preferredLanguage: "KHMER",
      coverPreset: 0,
      interests: [],
      socialLinks: [],
      portfolioCount: 0,
      email: "dara@example.com",
      emailVerified: true,
      authProvider: "LOCAL",
      googleLinked: false,
      accountStatus: "ACTIVE" as const,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      deletedAt: null,
      tokenVersion: 1,
      mobileRole: "USER",
      totalXp: 240,
      level: 3,
      adminRoleName: "Moderator",
      currentSanction: null,
    },
    refetch: vi.fn(),
  },
}));

const activityQuery = vi.hoisted(() => ({
  value: {
    isLoading: false,
    isError: false,
    data: {
      userId: "397939ea-0e71-4bb5-9b4a-3d2707296630",
      posts: 12,
      comments: 34,
      communitiesJoined: 5,
      eventsRsvpd: 3,
      reportsFiled: 1,
      reportsReceived: 2,
    },
    refetch: vi.fn(),
  },
}));

const securityQueries = vi.hoisted(() => ({
  sessions: {
    isLoading: false,
    isError: false,
    data: { content: [], page: 0, size: 25, totalElements: 0, totalPages: 0, hasNext: false },
    refetch: vi.fn(),
  },
  history: {
    isLoading: false,
    isError: false,
    data: { content: [], page: 0, size: 25, totalElements: 0, totalPages: 0, hasNext: false },
    refetch: vi.fn(),
  },
  xp: {
    isLoading: false,
    isError: false,
    data: {
      userId: "397939ea-0e71-4bb5-9b4a-3d2707296630",
      totalXp: 0,
      level: 1,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
      levelProgressPercent: 0,
      breakdown: [],
      ledger: { content: [], page: 0, size: 25, totalElements: 0, totalPages: 0, hasNext: false },
      badges: [],
    },
    refetch: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/users/397939ea-0e71-4bb5-9b4a-3d2707296630",
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.getSearch()),
}));

vi.mock("@/services/users", () => ({
  useUserDetail: () => userQuery.value,
  useUserActivity: () => activityQuery.value,
  useUserSessions: () => securityQueries.sessions,
  useUserLoginHistory: () => securityQueries.history,
  useUserXp: () => securityQueries.xp,
}));

afterEach(() => {
  cleanup();
  userQuery.value.isLoading = false;
  userQuery.value.isError = false;
  userQuery.value.error = null;
  userQuery.value.refetch.mockClear();
  activityQuery.value.isLoading = false;
  activityQuery.value.isError = false;
  activityQuery.value.refetch.mockClear();
  securityQueries.sessions.isLoading = false;
  securityQueries.sessions.isError = false;
  securityQueries.sessions.refetch.mockClear();
  securityQueries.history.isLoading = false;
  securityQueries.history.isError = false;
  securityQueries.history.refetch.mockClear();
  securityQueries.xp.isLoading = false;
  securityQueries.xp.isError = false;
  securityQueries.xp.refetch.mockClear();
  navigation.reset();
});

describe("UserDetailPage (ADM-073)", () => {
  it("renders the detail header, action slot, and accessible tab shell", () => {
    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    expect(screen.getByRole("heading", { name: "Dara Sok" })).toBeDefined();
    expect(screen.getAllByText("@dara.sok").length).toBeGreaterThan(0);
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Moderator")).toBeDefined();
    expect(screen.getByRole("img", { name: "Level 3" })).toBeDefined();
    expect(screen.getByTestId("user-detail-action-cluster")).toBeDefined();

    const tablist = screen.getByRole("tablist", { name: "User detail sections" });
    expect(tablist).toBeDefined();
    expect(screen.getAllByRole("tab")).toHaveLength(8);
    expect(screen.getByRole("tab", { name: "Profile" }).getAttribute("aria-selected")).toBe(
      "true",
    );

    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe("user-detail-tabs-tab-profile");
    expect(panel.className).toContain("focus-visible:ring-2");
  });

  it("deep-links to a valid tab and preserves unrelated URL parameters", () => {
    navigation.setSearch("tab=sessions&from=users");

    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    expect(screen.getByRole("tab", { name: "Devices & Sessions" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
      "user-detail-tabs-tab-sessions",
    );
  });

  it("updates URL state for clicks and keyboard tab navigation", () => {
    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    fireEvent.click(screen.getByRole("tab", { name: "Account" }));
    expect(navigation.replace).toHaveBeenCalledWith("/users/397939ea-0e71-4bb5-9b4a-3d2707296630?tab=account", {
      scroll: false,
    });

    fireEvent.keyDown(screen.getByRole("tab", { name: "Profile" }), { key: "ArrowRight" });
    expect(navigation.replace).toHaveBeenLastCalledWith(
      "/users/397939ea-0e71-4bb5-9b4a-3d2707296630?tab=account",
      { scroll: false },
    );
    expect(screen.getByRole("tab", { name: "Account" }).className).toContain("focus-visible:ring-2");
  });

  it("renders the Profile tab fields and an explicit em dash for null values", () => {
    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    expect(screen.getByText("Phnom Penh")).toBeDefined();
    expect(screen.getByText("Khmer")).toBeDefined();
    expect(screen.getAllByLabelText("Not available").length).toBeGreaterThan(0);
  });

  it("renders the Account tab from the detail projection", () => {
    navigation.setSearch("tab=account");

    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    expect(screen.getByText("dara@example.com")).toBeDefined();
    expect(screen.getByText("Verified")).toBeDefined();
    expect(screen.getByText("Local")).toBeDefined();
    expect(screen.getByText("Not linked")).toBeDefined();
    expect(screen.getByText("Created")).toBeDefined();
  });

  it("loads and renders Activity counts only for the Activity tab", () => {
    navigation.setSearch("tab=activity");

    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    expect(screen.getByTestId("user-activity-posts").textContent).toContain("12");
    expect(screen.getByTestId("user-activity-comments").textContent).toContain("34");
    expect(screen.getByTestId("user-activity-communitiesJoined").textContent).toContain("5");
    expect(screen.getByTestId("user-activity-eventsRsvpd").textContent).toContain("3");
    expect(screen.getByTestId("user-activity-reportsFiled").textContent).toContain("1");
    expect(screen.getByTestId("user-activity-reportsReceived").textContent).toContain("2");
  });

  it("renders an accessible retry state when Activity fails", () => {
    navigation.setSearch("tab=activity");
    activityQuery.value.isError = true;
    activityQuery.value.data = undefined as never;

    render(<UserDetailPage userId="397939ea-0e71-4bb5-9b4a-3d2707296630" />);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Activity unavailable")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(activityQuery.value.refetch).toHaveBeenCalledOnce();
  });

  it("renders safe loading and error states", () => {
    userQuery.value.isLoading = true;
    const { unmount } = render(<UserDetailPage userId="user-id" />);
    expect(screen.getByLabelText("Loading user details")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Dara Sok" })).toBeNull();
    unmount();

    userQuery.value.isLoading = false;
    userQuery.value.isError = true;
    userQuery.value.error = new ApiError({ status: 404, rawCode: "NOT_FOUND" });
    render(<UserDetailPage userId="missing-user" />);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("User not found")).toBeDefined();
    expect(screen.queryByText("NOT_FOUND")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(userQuery.value.refetch).toHaveBeenCalledOnce();
  });
});
