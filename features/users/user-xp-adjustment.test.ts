// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";

import type { AdminUserDetail } from "./types";
import {
  optimisticUserAfterXpAdjustment,
  projectXpState,
  useUserXpAdjustment,
  type UserXpAdjustmentInput,
} from "./user-xp-adjustment";

const userServices = vi.hoisted(() => ({
  adjustUserXp: vi.fn(),
}));

vi.mock("@/services/users", () => userServices);

const USER_ID = "user-1";
const REASON = "Verified campaign contribution";

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
    totalXp: 90,
    level: 1,
    adminRoleName: null,
    currentSanction: null,
    ...overrides,
  };
}

function Harness({ input }: { input: UserXpAdjustmentInput }) {
  const adjustment = useUserXpAdjustment(USER_ID);

  return createElement(
    "button",
    { type: "button", onClick: () => void adjustment.execute(input).catch(() => undefined) },
    "run adjustment",
  );
}

function renderHarness(queryClient: QueryClient, input: UserXpAdjustmentInput) {
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
  userServices.adjustUserXp.mockReset();
});

beforeEach(() => {
  userServices.adjustUserXp.mockResolvedValue({
    userId: USER_ID,
    requestedAmount: 100,
    appliedAmount: 100,
    totalXp: 190,
    level: 2,
  });
});

describe("XP projection (ADM-094)", () => {
  it("uses the backend level formula and floors negative totals at zero", () => {
    expect(projectXpState(90, 100)).toEqual({ totalXp: 190, level: 2 });
    expect(projectXpState(150, -200)).toEqual({ totalXp: 0, level: 1 });
    expect(optimisticUserAfterXpAdjustment(makeUser(), {
      action: "grant-xp",
      amount: 100,
      reason: REASON,
    })).toMatchObject({ totalXp: 190, level: 2 });
  });
});

describe("useUserXpAdjustment (ADM-094)", () => {
  it("optimistically grants XP, sends the signed request, and refreshes XP projections", async () => {
    const queryClient = makeQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const detailKey = queryKeys.users.detail(USER_ID);
    queryClient.setQueryData(detailKey, makeUser());

    renderHarness(queryClient, { action: "grant-xp", amount: 100, reason: REASON });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)).toMatchObject({
        totalXp: 190,
        level: 2,
      });
    });
    expect(userServices.adjustUserXp).toHaveBeenCalledWith(USER_ID, {
      amount: 100,
      reason: REASON,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.users.xpAll(USER_ID) });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.users.detail(USER_ID) });
  });

  it("sends a negative revoke amount", async () => {
    const queryClient = makeQueryClient();

    renderHarness(queryClient, {
      action: "revoke-xp",
      amount: -200,
      reason: "Corrected an accidental XP award",
    });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(userServices.adjustUserXp).toHaveBeenCalledWith(USER_ID, {
        amount: -200,
        reason: "Corrected an accidental XP award",
      });
    });
  });

  it("rolls back the optimistic projection when the server rejects the adjustment", async () => {
    userServices.adjustUserXp.mockRejectedValue(new Error("request failed"));
    const queryClient = makeQueryClient();
    const detailKey = queryKeys.users.detail(USER_ID);
    const previous = makeUser();
    queryClient.setQueryData(detailKey, previous);

    renderHarness(queryClient, { action: "grant-xp", amount: 100, reason: REASON });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)).toEqual(previous);
    });
  });
});
