// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTableState } from "@/hooks/use-table-state";

import {
  createDefaultUserFilters,
  USER_FILTER_CODECS,
  type UserFilters,
} from "./user-filters";
import { UserFilterBar } from "./user-filter-bar";

const navigation = {
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
  setSearch(value: string) {
    this.search = value;
  },
  reset() {
    this.search = "";
    this.push.mockClear();
    this.replace.mockClear();
  },
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/users",
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  navigation.reset();
});

function readFilters(): UserFilters {
  return JSON.parse(screen.getByTestId("user-filters").textContent ?? "{}");
}

function FilterHarness({ initial = createDefaultUserFilters() }: { initial?: UserFilters }) {
  const [filters, setFilters] = useState(initial);

  return (
    <>
      <UserFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={() => setFilters(createDefaultUserFilters())}
        universityOptions={["Royal University of Phnom Penh", "Institute of Technology of Cambodia"]}
      />
      <output data-testid="user-filters">{JSON.stringify(filters)}</output>
    </>
  );
}

function UrlHarness() {
  const state = useTableState<UserFilters>({
    filterCodecs: USER_FILTER_CODECS,
    searchDebounceMs: 0,
  });

  return (
    <UserFilterBar
      filters={state.filters}
      onFiltersChange={state.setFilters}
      onClearAll={state.reset}
      universityOptions={["Royal University of Phnom Penh"]}
    />
  );
}

describe("user filter contract (ADM-070)", () => {
  it("canonicalizes enum arrays and validates date and tri-state URL values", () => {
    expect(USER_FILTER_CODECS.status.serialize(["PENDING", "ACTIVE"])).toEqual([
      "PENDING,ACTIVE",
    ]);
    expect(USER_FILTER_CODECS.status.parse(["ACTIVE,PENDING"])).toEqual(["ACTIVE", "PENDING"]);
    expect(USER_FILTER_CODECS.emailVerified.parse(["true"])).toBe("VERIFIED");
    expect(USER_FILTER_CODECS.emailVerified.serialize("UNVERIFIED")).toEqual(["false"]);
    expect(USER_FILTER_CODECS.createdFrom.parse(["2026-02-29"])).toBeUndefined();
    expect(USER_FILTER_CODECS.createdFrom.parse(["2026-02-28"])).toBe("2026-02-28");
  });

  it("renders all thirteen filter controls with accessible labels", () => {
    render(<FilterHarness />);

    expect(screen.getByRole("button", { name: /Status filter/ })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Email verification" })).toBeDefined();
    expect(screen.getByRole("button", { name: /Work status filter/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /^University filter/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Gender filter/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Language filter/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Auth provider filter/ })).toBeDefined();
    expect(screen.getAllByRole("slider")).toHaveLength(4);
    expect(screen.getByLabelText("Registered from")).toBeDefined();
    expect(screen.getByLabelText("Registered to")).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Last active" })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Has active ban" })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Include deleted users" })).toBeDefined();
  });

  it("updates multi-select, tri-state, date, and boolean filter state", async () => {
    render(<FilterHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Status filter/ }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Pending" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Email verification" }), {
      target: { value: "VERIFIED" },
    });
    fireEvent.change(screen.getByLabelText("Registered from"), {
      target: { value: "2026-08-01" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Include deleted users" }));

    expect(readFilters()).toMatchObject({
      status: ["PENDING"],
      emailVerified: "VERIFIED",
      createdFrom: "2026-08-01",
      includeDeleted: true,
    });
  });

  it("supports university typeahead selection and exposes the loading state", async () => {
    const onUniversityQueryChange = vi.fn();
    render(
      <UserFilterBar
        filters={createDefaultUserFilters()}
        onFiltersChange={vi.fn()}
        onClearAll={vi.fn()}
        universityOptions={["Royal University of Phnom Penh", "Institute of Technology of Cambodia"]}
        universityLoading
        onUniversityQueryChange={onUniversityQueryChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "University filter" }));
    fireEvent.change(await screen.findByRole("textbox", { name: "Search universities" }), {
      target: { value: "royal" },
    });

    expect(onUniversityQueryChange).toHaveBeenCalledWith("royal");
    expect(screen.getByRole("status").textContent).toContain("Loading universities");
  });

  it("renders removable chips and clears the complete filter set", () => {
    render(
      <FilterHarness
        initial={{
          ...createDefaultUserFilters(),
          status: ["ACTIVE", "PENDING"],
          emailVerified: "UNVERIFIED",
          university: "Royal University of Phnom Penh",
          levelMin: 2,
          levelMax: 8,
          includeDeleted: true,
        }}
      />,
    );

    expect(screen.getByRole("region", { name: "Active filters" })).toBeDefined();
    expect(screen.getByText("Status: Active")).toBeDefined();
    expect(screen.getByText("University: Royal University of Phnom Penh")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Remove Status filter Active" }));
    expect(readFilters().status).toEqual(["PENDING"]);

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(readFilters()).toEqual(createDefaultUserFilters());
  });

  it("writes filter changes through the ADM-068 URL state hook", async () => {
    navigation.setSearch("status=ACTIVE");
    render(<UrlHarness />);

    fireEvent.change(screen.getByRole("combobox", { name: "Email verification" }), {
      target: { value: "VERIFIED" },
    });
    fireEvent.change(screen.getByLabelText("Registered from"), {
      target: { value: "2026-08-01" },
    });

    expect(navigation.push).toHaveBeenNthCalledWith(
      1,
      "/users?status=ACTIVE&emailVerified=true",
      { scroll: false },
    );
    expect(navigation.push).toHaveBeenNthCalledWith(
      2,
      "/users?status=ACTIVE&createdFrom=2026-08-01",
      { scroll: false },
    );
  });
});
