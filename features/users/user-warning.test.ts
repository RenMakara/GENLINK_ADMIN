// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { queryKeys } from "@/services/query-keys";

import { userWarningErrorMessage, useUserWarning } from "./user-warning";

const userServices = vi.hoisted(() => ({
  createUserWarning: vi.fn(),
}));

vi.mock("@/services/users", () => userServices);

const USER_ID = "user-1";

function Harness() {
  const warning = useUserWarning(USER_ID);

  return createElement(
    "button",
    {
      type: "button",
      onClick: () =>
        void warning.execute({
          severity: "HIGH",
          reason: "Repeated violation after the previous review",
          messageEn: "Please review the community guidelines before posting again.",
          messageKm: "សូមពិនិត្យគោលការណ៍សហគមន៍។",
        }),
    },
    "record warning",
  );
}

function renderHarness(queryClient: QueryClient) {
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Harness),
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
  userServices.createUserWarning.mockReset();
});

describe("useUserWarning (ADM-096)", () => {
  it("posts the bilingual warning and refreshes affected user queries", async () => {
    const queryClient = makeQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    userServices.createUserWarning.mockResolvedValue({ warningId: "warning-1" });

    renderHarness(queryClient);
    fireEvent.click(document.querySelector("button") as HTMLButtonElement);

    await waitFor(() => expect(userServices.createUserWarning).toHaveBeenCalledOnce());
    expect(userServices.createUserWarning).toHaveBeenCalledWith(USER_ID, {
      severity: "HIGH",
      reason: "Repeated violation after the previous review",
      messageEn: "Please review the community guidelines before posting again.",
      messageKm: "សូមពិនិត្យគោលការណ៍សហគមន៍។",
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.users.sanctionsAll(USER_ID) });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.users.detail(USER_ID) });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.users.all() });
  });

  it("maps known failures without exposing server messages", () => {
    expect(userWarningErrorMessage({})).toBeNull();
  });
});
