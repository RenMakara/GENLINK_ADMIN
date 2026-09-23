"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortingState } from "@tanstack/react-table";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

export type TableHistoryMode = "push" | "replace";

export interface TableFilterCodec<TValue> {
  /** Value used when the parameter is absent or cannot be decoded safely. */
  defaultValue: TValue;
  /** Return undefined when the URL values are invalid for this filter. */
  parse: (values: readonly string[]) => TValue | undefined;
  /** Return the repeated query values for this filter. Empty values are omitted. */
  serialize: (value: TValue) => readonly string[];
}

export type TableFilterCodecs<TFilters extends object> = {
  [Key in keyof TFilters]: TableFilterCodec<TFilters[Key]>;
};

export interface UseTableStateOptions<TFilters extends object = Record<string, never>> {
  /** IDs accepted by the page's sortable column definitions. */
  sortableColumnIds?: readonly string[];
  /** Generic page-owned filters; the hook does not know Users/Admins-specific business rules. */
  filterCodecs?: TableFilterCodecs<TFilters>;
  defaultSearch?: string;
  /** Internal zero-based default. The URL remains one-based for people sharing links. */
  defaultPageIndex?: number;
  defaultSorting?: SortingState;
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  searchParam?: string;
  sortParam?: string;
  pageParam?: string;
  pageSizeParam?: string;
  /** Search updates are debounced so typing does not create a history entry per keystroke. */
  searchDebounceMs?: number;
  /** Push is the default so Back/Forward restores previous table views. */
  history?: TableHistoryMode;
  scroll?: boolean;
}

export interface TableState<TFilters extends object> {
  search: string;
  filters: TFilters;
  sorting: SortingState;
  /** Zero-based, ready to pass to DataTable's pagination prop. */
  pageIndex: number;
  pageSize: number;
}

export interface UseTableStateResult<TFilters extends object> extends TableState<TFilters> {
  /** One-based page number represented in the URL. */
  page: number;
  setSearch: (value: string) => void;
  setFilters: (value: SetStateAction<TFilters>) => void;
  setFilter: <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => void;
  setSorting: (value: SortingState | ((previous: SortingState) => SortingState)) => void;
  setPageIndex: (value: number) => void;
  setPageSize: (value: number) => void;
  reset: () => void;
}

interface NormalizedTableStateOptions<TFilters extends object> {
  sortableColumnIds?: readonly string[];
  filterCodecs: TableFilterCodecs<TFilters>;
  defaultState: TableState<TFilters>;
  pageSizeOptions: readonly number[];
  searchParam: string;
  sortParam: string;
  pageParam: string;
  pageSizeParam: string;
  searchDebounceMs: number;
  history: TableHistoryMode;
  scroll: boolean;
  managedParamNames: ReadonlySet<string>;
}

type AnyTableFilterCodec = TableFilterCodec<unknown>;

function filterCodecEntries<TFilters extends object>(
  codecs: TableFilterCodecs<TFilters>,
): Array<[string, AnyTableFilterCodec]> {
  return Object.entries(codecs) as Array<[string, AnyTableFilterCodec]>;
}

function isSafePositiveInteger(value: string | null): value is string {
  return value !== null && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

function normalizePageIndex(value: number | undefined, fallback = 0) {
  return Number.isSafeInteger(value) && value !== undefined && value >= 0 ? value : fallback;
}

function normalizePageSize(value: number | undefined, options: readonly number[], fallback: number) {
  return value !== undefined && options.includes(value) ? value : fallback;
}

function sanitizeSorting(sorting: SortingState, sortableColumnIds?: readonly string[]): SortingState {
  const allowed = sortableColumnIds ? new Set(sortableColumnIds) : undefined;
  const seen = new Set<string>();

  return sorting.filter((sort) => {
    if (!sort.id || seen.has(sort.id) || (allowed && !allowed.has(sort.id))) return false;
    seen.add(sort.id);
    return true;
  });
}

export function serializeTableSorting(
  sorting: SortingState,
  sortableColumnIds?: readonly string[],
): string[] {
  return sanitizeSorting(sorting, sortableColumnIds).map(
    (sort) => `${sort.id},${sort.desc ? "desc" : "asc"}`,
  );
}

export function parseTableSorting(
  values: readonly string[],
  sortableColumnIds: readonly string[] | undefined,
  fallback: SortingState = [],
): SortingState {
  const allowed = sortableColumnIds ? new Set(sortableColumnIds) : undefined;
  const seen = new Set<string>();
  const parsed: SortingState = [];

  for (const value of values) {
    const [id, direction, ...extra] = value.split(",");
    if (
      !id ||
      extra.length > 0 ||
      (direction !== "asc" && direction !== "desc") ||
      seen.has(id) ||
      (allowed && !allowed.has(id))
    ) {
      continue;
    }

    seen.add(id);
    parsed.push({ id, desc: direction === "desc" });
  }

  return parsed.length > 0 ? parsed : sanitizeSorting(fallback, sortableColumnIds);
}

function sortingEquals(left: SortingState, right: SortingState) {
  return (
    left.length === right.length &&
    left.every((sort, index) => sort.id === right[index]?.id && sort.desc === right[index]?.desc)
  );
}

function defaultFilterValues<TFilters extends object>(
  codecs: TableFilterCodecs<TFilters>,
): TFilters {
  const defaults: Record<string, unknown> = {};

  for (const [key, codec] of filterCodecEntries(codecs)) {
    defaults[key] = codec.defaultValue;
  }

  return defaults as TFilters;
}

function filterValuesEqual<TValue>(
  left: TValue,
  right: TValue,
  codec: TableFilterCodec<TValue>,
) {
  const leftValues = codec.serialize(left).filter(Boolean);
  const rightValues = codec.serialize(right).filter(Boolean);
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

function normalizeOptions<TFilters extends object>(
  options: UseTableStateOptions<TFilters>,
): NormalizedTableStateOptions<TFilters> {
  const rawPageSizeOptions = options.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const pageSizeOptions = Array.from(
    new Set(rawPageSizeOptions.filter((value) => Number.isSafeInteger(value) && value > 0)),
  );
  const safePageSizeOptions = pageSizeOptions.length > 0 ? pageSizeOptions : DEFAULT_PAGE_SIZE_OPTIONS;
  const defaultPageSize = normalizePageSize(
    options.defaultPageSize,
    safePageSizeOptions,
    safePageSizeOptions[0],
  );
  const filterCodecs = options.filterCodecs ?? ({} as TableFilterCodecs<TFilters>);
  const defaultFilters = defaultFilterValues(filterCodecs);
  const searchParam = options.searchParam ?? "q";
  const sortParam = options.sortParam ?? "sort";
  const pageParam = options.pageParam ?? "page";
  const pageSizeParam = options.pageSizeParam ?? "size";
  const defaultState: TableState<TFilters> = {
    search: options.defaultSearch?.trim() ?? "",
    filters: defaultFilters,
    sorting: sanitizeSorting(options.defaultSorting ?? [], options.sortableColumnIds),
    pageIndex: normalizePageIndex(options.defaultPageIndex),
    pageSize: defaultPageSize,
  };

  return {
    sortableColumnIds: options.sortableColumnIds,
    filterCodecs,
    defaultState,
    pageSizeOptions: safePageSizeOptions,
    searchParam,
    sortParam,
    pageParam,
    pageSizeParam,
    searchDebounceMs: Math.max(0, options.searchDebounceMs ?? DEFAULT_SEARCH_DEBOUNCE_MS),
    history: options.history ?? "push",
    scroll: options.scroll ?? false,
    managedParamNames: new Set([
      searchParam,
      sortParam,
      pageParam,
      pageSizeParam,
      ...Object.keys(filterCodecs),
    ]),
  };
}

function parseTableState<TFilters extends object>(
  params: URLSearchParams,
  options: NormalizedTableStateOptions<TFilters>,
): TableState<TFilters> {
  const filters = { ...options.defaultState.filters } as TFilters;

  for (const [key, codec] of filterCodecEntries(options.filterCodecs)) {
    const values = params.getAll(key);
    if (values.length === 0) continue;
    const parsed = codec.parse(values);
    filters[key as keyof TFilters] = (parsed ?? codec.defaultValue) as TFilters[keyof TFilters];
  }

  const pageIndex = isSafePositiveInteger(params.get(options.pageParam))
    ? Number(params.get(options.pageParam)) - 1
    : options.defaultState.pageIndex;
  const pageSizeValue = params.get(options.pageSizeParam);
  const pageSize =
    isSafePositiveInteger(pageSizeValue) && options.pageSizeOptions.includes(Number(pageSizeValue))
      ? Number(pageSizeValue)
      : options.defaultState.pageSize;
  const rawSearch = params.get(options.searchParam);

  return {
    search: rawSearch?.trim() || options.defaultState.search,
    filters,
    sorting: parseTableSorting(
      params.getAll(options.sortParam),
      options.sortableColumnIds,
      options.defaultState.sorting,
    ),
    pageIndex,
    pageSize,
  };
}

function serializeTableState<TFilters extends object>(
  state: TableState<TFilters>,
  currentSearch: string,
  options: NormalizedTableStateOptions<TFilters>,
) {
  const current = new URLSearchParams(currentSearch);
  const next = new URLSearchParams();

  // Preserve parameters owned by the page or another feature, while rebuilding table-owned
  // parameters in one stable order.
  for (const [key, value] of current) {
    if (!options.managedParamNames.has(key)) next.append(key, value);
  }

  const search = state.search.trim();
  if (search && search !== options.defaultState.search) {
    next.set(options.searchParam, search);
  }

  for (const [key, codec] of filterCodecEntries(options.filterCodecs)) {
    const value = state.filters[key as keyof TFilters] as unknown;
    const defaultValue = codec.defaultValue;
    const serialized = codec.serialize(value).filter(Boolean);

    if (!filterValuesEqual(value, defaultValue, codec)) {
      for (const item of serialized) next.append(key, item);
    }
  }

  const sorting = sanitizeSorting(state.sorting, options.sortableColumnIds);
  if (!sortingEquals(sorting, options.defaultState.sorting)) {
    for (const item of serializeTableSorting(sorting, options.sortableColumnIds)) {
      next.append(options.sortParam, item);
    }
  }

  const pageIndex = normalizePageIndex(state.pageIndex, options.defaultState.pageIndex);
  if (pageIndex !== options.defaultState.pageIndex) {
    next.set(options.pageParam, String(pageIndex + 1));
  }

  const pageSize = normalizePageSize(
    state.pageSize,
    options.pageSizeOptions,
    options.defaultState.pageSize,
  );
  if (pageSize !== options.defaultState.pageSize) {
    next.set(options.pageSizeParam, String(pageSize));
  }

  return next.toString();
}

export const tableFilterCodecs = {
  string(defaultValue = ""): TableFilterCodec<string> {
    return {
      defaultValue,
      parse: (values) => values.at(-1) || defaultValue,
      serialize: (value) => (value ? [value] : []),
    };
  },

  stringArray(defaultValue: readonly string[] = []): TableFilterCodec<string[]> {
    const fallback = [...defaultValue];
    return {
      defaultValue: fallback,
      parse: (values) => {
        const parsed = values.filter(Boolean);
        return parsed.length > 0 ? parsed : fallback.slice();
      },
      serialize: (value) => value.filter(Boolean),
    };
  },

  boolean(defaultValue = false): TableFilterCodec<boolean> {
    return {
      defaultValue,
      parse: (values) => {
        const value = values.at(-1);
        if (value === "true") return true;
        if (value === "false") return false;
        return undefined;
      },
      serialize: (value) => (value === defaultValue ? [] : [String(value)]),
    };
  },

  enum<const TValue extends string>(
    allowedValues: readonly TValue[],
    defaultValue: TValue,
  ): TableFilterCodec<TValue> {
    const allowed = new Set(allowedValues);
    return {
      defaultValue,
      parse: (values) => {
        const value = values.at(-1);
        return value && allowed.has(value as TValue) ? (value as TValue) : undefined;
      },
      serialize: (value) => (value === defaultValue ? [] : [value]),
    };
  },
};

export function useTableState<TFilters extends object = Record<string, never>>(
  options: UseTableStateOptions<TFilters> = {},
): UseTableStateResult<TFilters> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const tableState = useMemo(
    () => parseTableState(new URLSearchParams(serializedSearchParams), normalizedOptions),
    [normalizedOptions, serializedSearchParams],
  );
  const [searchDraft, setSearchDraft] = useState({
    source: serializedSearchParams,
    value: tableState.search,
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSearch =
    searchDraft.source === serializedSearchParams ? searchDraft.value : tableState.search;

  useEffect(() => {
    if (searchTimerRef.current !== null) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, [serializedSearchParams]);

  useEffect(
    () => () => {
      if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
    },
    [],
  );

  const commit = useCallback(
    (patch: Partial<TableState<TFilters>>) => {
      const nextState = { ...tableState, ...patch };
      const nextSearchParams = serializeTableState(
        nextState,
        serializedSearchParams,
        normalizedOptions,
      );
      if (nextSearchParams === serializedSearchParams) return;

      const href = nextSearchParams ? `${pathname}?${nextSearchParams}` : pathname;
      if (normalizedOptions.history === "push") {
        router.push(href, { scroll: normalizedOptions.scroll });
      } else {
        router.replace(href, { scroll: normalizedOptions.scroll });
      }
    },
    [normalizedOptions, pathname, router, serializedSearchParams, tableState],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchDraft({ source: serializedSearchParams, value });
      if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);

      const commitSearch = () => {
        searchTimerRef.current = null;
        commit({ search: value.trim(), pageIndex: normalizedOptions.defaultState.pageIndex });
      };

      if (normalizedOptions.searchDebounceMs === 0) {
        commitSearch();
      } else {
        searchTimerRef.current = setTimeout(commitSearch, normalizedOptions.searchDebounceMs);
      }
    },
    [commit, normalizedOptions, serializedSearchParams],
  );

  const setFilters = useCallback(
    (value: SetStateAction<TFilters>) => {
      const nextFilters = typeof value === "function" ? value(tableState.filters) : value;
      commit({
        filters: nextFilters,
        pageIndex: normalizedOptions.defaultState.pageIndex,
      });
    },
    [commit, normalizedOptions, tableState.filters],
  );

  const setFilter = useCallback(
    <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
      setFilters((previous) => ({ ...previous, [key]: value }));
    },
    [setFilters],
  );

  const setSorting = useCallback(
    (value: SortingState | ((previous: SortingState) => SortingState)) => {
      const nextSorting = typeof value === "function" ? value(tableState.sorting) : value;
      commit({
        sorting: sanitizeSorting(nextSorting, normalizedOptions.sortableColumnIds),
        pageIndex: normalizedOptions.defaultState.pageIndex,
      });
    },
    [commit, normalizedOptions, tableState.sorting],
  );

  const setPageIndex = useCallback((value: number) => {
    commit({ pageIndex: normalizePageIndex(value, normalizedOptions.defaultState.pageIndex) });
  }, [commit, normalizedOptions]);

  const setPageSize = useCallback((value: number) => {
    commit({
      pageSize: normalizePageSize(
        value,
        normalizedOptions.pageSizeOptions,
        normalizedOptions.defaultState.pageSize,
      ),
      pageIndex: normalizedOptions.defaultState.pageIndex,
    });
  }, [commit, normalizedOptions]);

  const reset = useCallback(() => {
    setSearchDraft({
      source: serializedSearchParams,
      value: normalizedOptions.defaultState.search,
    });
    if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
    commit(normalizedOptions.defaultState);
  }, [commit, normalizedOptions, serializedSearchParams]);

  return {
    ...tableState,
    search: visibleSearch,
    page: tableState.pageIndex + 1,
    setSearch,
    setFilters,
    setFilter,
    setSorting,
    setPageIndex,
    setPageSize,
    reset,
  };
}
