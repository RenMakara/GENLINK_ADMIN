// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";
import { ApiError } from "@/lib/api/errors";

import {
  useUserSanctionLift,
  userSanctionLiftErrorMessage,
  type UserSanctionLiftInput,
} from "./user-sanction-lift";

const sanctionService = vi.hoisted(() => ({
  liftUserSanction: vi.fn(),
}));

vi.mock("@/services/users", () => sanctionService);

const USER_ID = "user-1";

function Harness({ input }: { input: UserSanctionLiftInput }) {
  const lift = useUserSanctionLift(USER_ID);

  return createElement(
    "button",
    { type: "button", onClick: () => void lift.execute(input).catch(() => undefined) },
    "lift sanction",
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
  sanctionService.liftUserSanction.mockReset();
});

beforeEach(() => {
  sanctionService.liftUserSanction.mockResolvedValue(undefined);
});

describe("useUserSanctionLift (ADM-095)", () => {
  it("calls the id-based lift endpoint and refreshes detail, timeline, and list caches", async () => {
    const queryClient = makeQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Harness, {
          input: { sanctionId: "sanction-1", reason: "Review completed by moderation staff" },
        }),
      ),
    );
    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      expect(sanctionService.liftUserSanction).toHaveBeenCalledWith("sanction-1", {
        reason: "Review completed by moderation staff",
      });
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.sanctions.all() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.users.detail(USER_ID) });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.users.sanctionsAll(USER_ID) });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.users.all() });
  });

  it("maps known lift failures without exposing raw server messages", () => {
    expect(
      userSanctionLiftErrorMessage(
        new ApiError({ status: 403, rawCode: "FORBIDDEN", serverMessage: "internal details" }),
      ),
    ).toBe("You are not authorized to lift enforcement records.");
    expect(userSanctionLiftErrorMessage({})).toBeNull();
  });
});
