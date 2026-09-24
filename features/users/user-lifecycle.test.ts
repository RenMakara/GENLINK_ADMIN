// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";

import type { AdminUserDetail } from "./types";
import {
  optimisticUserAfterLifecycle,
  useUserLifecycle,
  type UserLifecycleInput,
} from "./user-lifecycle";

const userServices = vi.hoisted(() => ({
  deleteUser: vi.fn(),
  restoreUser: vi.fn(),
}));

vi.mock("@/services/users", () => userServices);

const USER_ID = "user-1";

function makeUser(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    userId: USER_ID,
    fullName: "Dara Sok",
    username: "dara.sok",
    avatarUrl: null,
    bio: null,
    dateOfBirth: null,
    gender: null,
    phoneNumber: null,
    location: null,
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
    accountStatus: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
    tokenVersion: 1,
    mobileRole: "USER",
    totalXp: 0,
    level: 1,
    adminRoleName: null,
    currentSanction: null,
    ...overrides,
  };
}

function Harness({ input }: { input: UserLifecycleInput }) {
  const lifecycle = useUserLifecycle(USER_ID);

  return createElement(
    "button",
    { type: "button", onClick: () => void lifecycle.execute(input).catch(() => undefined) },
    "run action",
  );
}

function renderHarness(queryClient: QueryClient, input: UserLifecycleInput) {
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Harness, { input }),
    ),
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const REASON = "Confirmed duplicate account after review";

afterEach(() => {
  cleanup();
  userServices.deleteUser.mockReset();
  userServices.restoreUser.mockReset();
});

beforeEach(() => {
  userServices.deleteUser.mockResolvedValue(undefined);
  userServices.restoreUser.mockResolvedValue(undefined);
});

describe("useUserLifecycle (ADM-093)", () => {
  it("optimistically soft-deletes and refreshes sessions", async () => {
    const queryClient = makeQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const detailKey = queryKeys.users.detail(USER_ID);
    queryClient.setQueryData(detailKey, makeUser());

    renderHarness(queryClient, { action: "delete", reason: REASON });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.accountStatus).toBe("DELETED");
    });
    expect(userServices.deleteUser).toHaveBeenCalledWith(USER_ID, { reason: REASON });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.users.sessionsAll(USER_ID),
    });
  });

  it("restores through the lifecycle endpoint", async () => {
    const queryClient = makeQueryClient();

    renderHarness(queryClient, { action: "restore", reason: REASON });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(userServices.restoreUser).toHaveBeenCalledWith(USER_ID, { reason: REASON });
    });
  });

  it("rolls back the optimistic delete when the server rejects it", async () => {
    userServices.deleteUser.mockRejectedValue(new Error("request failed"));
    const queryClient = makeQueryClient();
    const detailKey = queryKeys.users.detail(USER_ID);
    queryClient.setQueryData(detailKey, makeUser());

    renderHarness(queryClient, { action: "delete", reason: REASON });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.accountStatus).toBe("ACTIVE");
    });
  });
});

describe("optimisticUserAfterLifecycle", () => {
  it("does not invent a restored status that the API has not returned", () => {
    const deleted = makeUser({ accountStatus: "DELETED", deletedAt: new Date().toISOString() });

    const result = optimisticUserAfterLifecycle(deleted, { action: "restore", reason: REASON });

    expect(result).toEqual(deleted);
  });
});
