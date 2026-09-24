// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";

import type { AdminUserDetail } from "./types";
import {
  optimisticUserAfterEnforcement,
  useUserEnforcement,
  type UserEnforcementInput,
} from "./user-enforcement";

const userServices = vi.hoisted(() => ({
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  suspendUser: vi.fn(),
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

function Harness({ input }: { input: UserEnforcementInput }) {
  const enforcement = useUserEnforcement(USER_ID);

  return createElement(
    "button",
    { type: "button", onClick: () => void enforcement.execute(input).catch(() => undefined) },
    "run action",
  );
}

function renderHarness(queryClient: QueryClient, input: UserEnforcementInput) {
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

afterEach(() => {
  cleanup();
  userServices.banUser.mockReset();
  userServices.unbanUser.mockReset();
  userServices.suspendUser.mockReset();
});

beforeEach(() => {
  userServices.banUser.mockResolvedValue(undefined);
  userServices.unbanUser.mockResolvedValue(undefined);
  userServices.suspendUser.mockResolvedValue(undefined);
});

describe("useUserEnforcement (ADM-091)", () => {
  it("applies an optimistic ban and sends the reason contract", async () => {
    const queryClient = makeQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const detailKey = ["users", "detail", USER_ID] as const;
    queryClient.setQueryData(detailKey, makeUser());

    renderHarness(queryClient, {
      action: "ban",
      reason: "Repeated abuse of the community rules",
    });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.accountStatus).toBe("BANNED");
    });
    expect(userServices.banUser).toHaveBeenCalledWith(USER_ID, {
      reason: "Repeated abuse of the community rules",
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.users.sessionsAll(USER_ID),
    });
  });

  it("rolls the optimistic status back when the server rejects the mutation", async () => {
    userServices.banUser.mockRejectedValue(new Error("request failed"));
    const queryClient = makeQueryClient();
    const detailKey = ["users", "detail", USER_ID] as const;
    queryClient.setQueryData(detailKey, makeUser());

    renderHarness(queryClient, {
      action: "ban",
      reason: "Repeated abuse of the community rules",
    });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.accountStatus).toBe("ACTIVE");
    });
  });
});

describe("optimisticUserAfterEnforcement", () => {
  it("restores a sanction's captured previous status on unban", () => {
    const banned = makeUser({
      accountStatus: "BANNED",
      currentSanction: {
        type: "BAN",
        severity: "HIGH",
        reason: "Repeated abuse of the community rules",
        previousStatus: "PENDING",
        startsAt: "2026-01-01T00:00:00Z",
        expiresAt: null,
        acknowledgedAt: null,
      },
    });

    const result = optimisticUserAfterEnforcement(banned, {
      action: "unban",
      reason: "Review completed and access restored",
    });

    expect(result.accountStatus).toBe("PENDING");
    expect(result.currentSanction).toBeNull();
  });
});
