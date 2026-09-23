// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseTableSorting,
  tableFilterCodecs,
  serializeTableSorting,
  useTableState,
  type UseTableStateOptions,
} from "./use-table-state";

const navigation = vi.hoisted(() => {
  let search = "";

  const toSearch = (href: string) => new URL(href, "https://admin.test").search.slice(1);
  const push = vi.fn((href: string) => {
    search = toSearch(href);
  });
  const replace = vi.fn((href: string) => {
    search = toSearch(href);
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

vi.mock("next/navigation", () => ({
  usePathname: () => "/users",
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.getSearch()),
}));

type Filters = {
  status: "ALL" | "PENDING";
  roles: string[];
};

const options: UseTableStateOptions<Filters> = {
  sortableColumnIds: ["name", "createdAt"],
  filterCodecs: {
    status: tableFilterCodecs.enum(["ALL", "PENDING"], "ALL"),
    roles: tableFilterCodecs.stringArray(),
  },
  pageSizeOptions: [10, 25, 50],
  defaultPageSize: 25,
  searchDebounceMs: 0,
};

function StateHarness({
  tableOptions = options,
}: {
  tableOptions?: UseTableStateOptions<Filters>;
}) {
  const state = useTableState<Filters>(tableOptions);

  return (
    <div>
      <output data-testid="state">
        {JSON.stringify({
          search: state.search,
          filters: state.filters,
          sorting: state.sorting,
          pageIndex: state.pageIndex,
          pageSize: state.pageSize,
          page: state.page,
        })}
      </output>
      <input
        aria-label="Search users"
        value={state.search}
        onChange={(event) => state.setSearch(event.currentTarget.value)}
      />
      <button type="button" onClick={() => state.setFilter("status", "PENDING")}>
        Set status
      </button>
      <button
        type="button"
        onClick={() => state.setFilters({ status: "PENDING", roles: ["ADMIN", "REVIEWER"] })}
      >
        Set filters
      </button>
      <button
        type="button"
        onClick={() =>
          state.setSorting([
            { id: "name", desc: true },
            { id: "createdAt", desc: false },
          ])
        }
      >
        Set sorting
      </button>
      <button type="button" onClick={() => state.setPageIndex(2)}>
        Set page
      </button>
      <button type="button" onClick={() => state.setPageSize(50)}>
        Set page size
      </button>
      <button type="button" onClick={state.reset}>
        Reset
      </button>
    </div>
  );
}

function readState() {
  return JSON.parse(screen.getByTestId("state").textContent ?? "{}");
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  navigation.reset();
});

describe("useTableState (ADM-068)", () => {
  it("restores search, filters, sorting, page, and size from a shared URL", () => {
    navigation.setSearch(
      "q=alice%20sok&status=PENDING&roles=ADMIN&roles=REVIEWER&sort=name%2Cdesc&sort=createdAt%2Casc&page=3&size=50",
    );

    render(<StateHarness />);

    expect(readState()).toEqual({
      search: "alice sok",
      filters: { status: "PENDING", roles: ["ADMIN", "REVIEWER"] },
      sorting: [
        { id: "name", desc: true },
        { id: "createdAt", desc: false },
      ],
      pageIndex: 2,
      pageSize: 50,
      page: 3,
    });
    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("updates search immediately when a page opts out of debounce", () => {
    render(<StateHarness />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search users" }), {
      target: { value: "  dara sok  " },
    });

    expect(navigation.push).toHaveBeenCalledWith("/users?q=dara+sok", { scroll: false });
  });

  it("debounces search changes into one history update", () => {
    vi.useFakeTimers();
    render(<StateHarness tableOptions={{ ...options, searchDebounceMs: 300 }} />);

    const search = screen.getByRole("textbox", { name: "Search users" });
    fireEvent.change(search, { target: { value: "d" } });
    fireEvent.change(search, { target: { value: "da" } });
    fireEvent.change(search, { target: { value: "dara" } });

    expect(navigation.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(299));
    expect(navigation.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(navigation.push).toHaveBeenCalledOnce();
    expect(navigation.push).toHaveBeenCalledWith("/users?q=dara", { scroll: false });
  });

  it("serializes filters as readable repeated parameters and preserves unrelated params", () => {
    navigation.setSearch("tab=sessions&page=3");
    render(<StateHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Set filters" }));

    expect(navigation.push).toHaveBeenCalledWith(
      "/users?tab=sessions&status=PENDING&roles=ADMIN&roles=REVIEWER",
      { scroll: false },
    );
  });

  it("serializes sorting deterministically and rejects unknown column IDs", () => {
    render(<StateHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Set sorting" }));

    expect(navigation.push).toHaveBeenCalledWith(
      "/users?sort=name%2Cdesc&sort=createdAt%2Casc",
      { scroll: false },
    );
    expect(
      serializeTableSorting(
        [
          { id: "createdAt", desc: true },
          { id: "name", desc: false },
          { id: "name", desc: true },
          { id: "passwordHash", desc: false },
        ],
        ["name", "createdAt"],
      ),
    ).toEqual(["createdAt,desc", "name,asc"]);
    expect(parseTableSorting(["passwordHash,asc", "name,desc"], ["name"])).toEqual([
      { id: "name", desc: true },
    ]);
  });

  it("uses one-based page URLs, resets page for new query state, and omits defaults", () => {
    navigation.setSearch("page=3&size=50");
    render(<StateHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Set sorting" }));
    expect(navigation.push).toHaveBeenCalledWith(
      "/users?sort=name%2Cdesc&sort=createdAt%2Casc&size=50",
      { scroll: false },
    );

    navigation.reset();
    cleanup();
    render(<StateHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Set page" }));
    expect(navigation.push).toHaveBeenCalledWith("/users?page=3", { scroll: false });
    navigation.reset();
    cleanup();
    render(<StateHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Set page size" }));
    expect(navigation.push).toHaveBeenCalledWith("/users?size=50", { scroll: false });
  });

  it("falls back safely for invalid page, size, filters, and sorting values", () => {
    navigation.setSearch(
      "page=0&size=999&status=UNKNOWN&roles=&sort=unknown%2Casc&sort=name%2Csideways",
    );

    render(<StateHarness />);

    expect(readState()).toEqual({
      search: "",
      filters: { status: "ALL", roles: [] },
      sorting: [],
      pageIndex: 0,
      pageSize: 25,
      page: 1,
    });
  });

  it("reacts to external URL changes for browser Back/Forward without pushing", () => {
    navigation.setSearch("q=first&page=2");
    const view = render(<StateHarness />);
    expect(readState()).toMatchObject({ search: "first", pageIndex: 1, page: 2 });

    navigation.setSearch("q=second&page=4&size=10");
    view.rerender(<StateHarness />);

    expect(readState()).toMatchObject({ search: "second", pageIndex: 3, page: 4, pageSize: 10 });
    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("can use replace history for callers that do not want table entries", () => {
    render(<StateHarness tableOptions={{ ...options, history: "replace" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Set page" }));

    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledWith("/users?page=3", { scroll: false });
  });
});
