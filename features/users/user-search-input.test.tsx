// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTableState } from "@/hooks/use-table-state";

import { UserSearchInput } from "./user-search-input";

const navigation = vi.hoisted(() => {
  let search = "";

  const toSearch = (href: string) => new URL(href, "https://admin.test").search.slice(1);
  const push = vi.fn((href: string) => {
    search = toSearch(href);
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

vi.mock("next/navigation", () => ({
  usePathname: () => "/users",
  useRouter: () => ({ push: navigation.push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navigation.getSearch()),
}));

function ControlledSearch({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <UserSearchInput value={value} onValueChange={setValue} />
      <output data-testid="value">{value}</output>
    </>
  );
}

function ConnectedSearch() {
  const state = useTableState({ searchDebounceMs: 300 });
  return <UserSearchInput value={state.search} onValueChange={state.setSearch} />;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  navigation.reset();
});

describe("UserSearchInput (ADM-071)", () => {
  it("renders an accessible searchbox with a clear affordance only when populated", () => {
    render(<ControlledSearch />);

    const input = screen.getByRole("searchbox", { name: "Search users" });
    expect(input.getAttribute("placeholder")).toBe("Search users…");
    expect(screen.queryByRole("button", { name: "Clear search users" })).toBeNull();

    fireEvent.change(input, { target: { value: "alice" } });

    expect(screen.getByRole("button", { name: "Clear search users" })).toBeDefined();
  });

  it("clears the controlled value through the same change callback", () => {
    render(<ControlledSearch initialValue="alice" />);

    fireEvent.click(screen.getByRole("button", { name: "Clear search users" }));

    expect((screen.getByRole("searchbox", { name: "Search users" }) as HTMLInputElement).value).toBe(
      "",
    );
    expect(screen.getByTestId("value").textContent).toBe("");
  });

  it("composes with useTableState for one debounced URL update and URL restoration", () => {
    vi.useFakeTimers();
    navigation.setSearch("q=existing%20user");
    render(<ConnectedSearch />);

    const input = screen.getByRole("searchbox", { name: "Search users" });
    expect((input as HTMLInputElement).value).toBe("existing user");

    fireEvent.change(input, { target: { value: "d" } });
    fireEvent.change(input, { target: { value: "da" } });
    fireEvent.change(input, { target: { value: "dara" } });

    expect(navigation.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(299));
    expect(navigation.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));

    expect(navigation.push).toHaveBeenCalledOnce();
    expect(navigation.push).toHaveBeenCalledWith("/users?q=dara", { scroll: false });
  });
});
