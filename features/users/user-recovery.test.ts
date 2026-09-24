// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";

import type { AdminUserDetail } from "./types";
import {
  optimisticUserAfterRecovery,
  useUserRecovery,
  type UserRecoveryInput,
} from "./user-recovery";

const userServices = vi.hoisted(() => ({
  verifyUserEmail: vi.fn(),
  resetUserPassword: vi.fn(),
  forceLogoutUser: vi.fn(),
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
    emailVerified: false,
    authProvider: "LOCAL",
    googleLinked: false,
    accountStatus: "PENDING",
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

function Harness({ input }: { input: UserRecoveryInput }) {
  const recovery = useUserRecovery(USER_ID);

  return createElement(
    "button",
    { type: "button", onClick: () => void recovery.execute(input).catch(() => undefined) },
    "run action",
  );
}

function renderHarness(queryClient: QueryClient, input: UserRecoveryInput) {
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
  userServices.verifyUserEmail.mockReset();
  userServices.resetUserPassword.mockReset();
  userServices.forceLogoutUser.mockReset();
});

beforeEach(() => {
  userServices.verifyUserEmail.mockResolvedValue(undefined);
  userServices.resetUserPassword.mockResolvedValue(undefined);
  userServices.forceLogoutUser.mockResolvedValue(undefined);
});

describe("useUserRecovery (ADM-092)", () => {
  it("optimistically verifies the email and refreshes user projections", async () => {
    const queryClient = makeQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const detailKey = queryKeys.users.detail(USER_ID);
    queryClient.setQueryData(detailKey, makeUser());

    renderHarness(queryClient, { action: "verify-email", reason: "" });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.emailVerified).toBe(true);
    });
    expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.accountStatus).toBe("ACTIVE");
    expect(userServices.verifyUserEmail).toHaveBeenCalledWith(USER_ID);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.users.all() });
  });

  it("sends reset-password without accepting a password value", async () => {
    const queryClient = makeQueryClient();

    renderHarness(queryClient, { action: "reset-password", reason: "" });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => expect(userServices.resetUserPassword).toHaveBeenCalledWith(USER_ID));
  });

  it("refreshes sessions after force logout", async () => {
    const queryClient = makeQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const reason = "Security review requires all sessions to be revoked";

    renderHarness(queryClient, { action: "force-logout", reason });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => expect(userServices.forceLogoutUser).toHaveBeenCalledWith(USER_ID));
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.users.sessionsAll(USER_ID),
    });
  });

  it("rolls back optimistic verification when the server rejects it", async () => {
    userServices.verifyUserEmail.mockRejectedValue(new Error("request failed"));
    const queryClient = makeQueryClient();
    const detailKey = queryKeys.users.detail(USER_ID);
    const previous = makeUser();
    queryClient.setQueryData(detailKey, previous);

    renderHarness(queryClient, { action: "verify-email", reason: "" });
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(queryClient.getQueryData<AdminUserDetail>(detailKey)?.emailVerified).toBe(false);
    });
  });
});

describe("optimisticUserAfterRecovery", () => {
  it("activates a pending account when its email is verified", () => {
    const result = optimisticUserAfterRecovery(makeUser(), {
      action: "verify-email",
      reason: "",
    });

    expect(result.emailVerified).toBe(true);
    expect(result.accountStatus).toBe("ACTIVE");
  });
});
