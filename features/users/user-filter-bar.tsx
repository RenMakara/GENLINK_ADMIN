"use client";

import { useMemo, useState, type ReactNode, type SetStateAction } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider, SliderThumb } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/ui/status";

import {
  DEFAULT_USER_LEVEL_BOUNDS,
  DEFAULT_USER_XP_BOUNDS,
  USER_FILTER_OPTIONS,
  USER_LAST_ACTIVE_OPTIONS,
  labelForFilterValue,
  type UserFilters,
  type UserRangeBounds,
  type UserEmailVerificationState,
  type UserGender,
  type UserAuthProvider,
  type UserLanguage,
  type UserLastActivePreset,
} from "./user-filters";
import type { UserWorkStatus } from "./types";

type StringOption<TValue extends string> = { value: TValue; label: string };
type ArrayFilterKey = "status" | "workStatus" | "gender" | "language" | "authProvider";
const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");

export interface UserFilterBarProps {
  filters: UserFilters;
  onFiltersChange: (value: SetStateAction<UserFilters>) => void;
  onClearAll: () => void;
  /** Values returned by ADM-066; the bar does not fetch or cache them itself. */
  universityOptions?: readonly string[];
  universityLoading?: boolean;
  universityQuery?: string;
  onUniversityQueryChange?: (value: string) => void;
  levelBounds?: UserRangeBounds;
  xpBounds?: UserRangeBounds;
  className?: string;
}

function updateFilter<TKey extends keyof UserFilters>(
  onFiltersChange: UserFilterBarProps["onFiltersChange"],
  key: TKey,
  value: UserFilters[TKey],
) {
  onFiltersChange((previous) => ({ ...previous, [key]: value }));
}

function selectedCountLabel(count: number): ReactNode {
  return count > 0 ? <span className="text-xs text-muted-foreground">{count}</span> : null;
}

function FacetFilter<TValue extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly StringOption<TValue>[];
  selected: readonly TValue[];
  onChange: (next: TValue[]) => void;
}) {
  const selectedSet = new Set(selected);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`${label} filter${selected.length ? `, ${selected.length} selected` : ""}`}
        >
          {label}
          {selectedCountLabel(selected.length)}
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2">
        <fieldset className="flex flex-col gap-1">
          <legend className="px-2 py-1 text-xs font-medium text-muted-foreground">{label}</legend>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent focus-within:bg-accent"
            >
              <Checkbox
                aria-label={option.label}
                checked={selectedSet.has(option.value)}
                onCheckedChange={(checked) => {
                  const next = new Set(selected);
                  if (checked === true) next.add(option.value);
                  else next.delete(option.value);
                  onChange(options.map(({ value }) => value).filter((value) => next.has(value)));
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}

function SelectFilter<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: readonly StringOption<TValue>[];
  onChange: (value: TValue) => void;
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as TValue)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UniversityFilter({
  value,
  options,
  loading,
  query: controlledQuery,
  onQueryChange,
  onChange,
}: {
  value: string;
  options: readonly string[];
  loading: boolean;
  query?: string;
  onQueryChange?: (value: string) => void;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const query = controlledQuery ?? localQuery;
  const visibleOptions = useMemo(() => {
    const allOptions = Array.from(new Set([value, ...options].filter(Boolean)));
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? allOptions.filter((option) => option.toLowerCase().includes(normalizedQuery))
      : allOptions;
  }, [options, query, value]);

  const setQuery = (next: string) => {
    setLocalQuery(next);
    onQueryChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`University filter${value ? `, ${value}` : ""}`}
          className="max-w-56"
        >
          <span className="truncate">{value || "University"}</span>
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2">
        <Input
          aria-label="Search universities"
          placeholder="Search universities…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          className="mb-2"
        />
        <div role="listbox" aria-label="University options" className="max-h-56 overflow-y-auto">
          <PopoverClose asChild>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className="flex min-h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Any university
              {!value ? <Check className="size-4" aria-hidden="true" /> : null}
            </button>
          </PopoverClose>
          {loading ? (
            <p className="px-2 py-3 text-sm text-muted-foreground" role="status">
              Loading universities…
            </p>
          ) : visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <PopoverClose asChild key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className="flex min-h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option}</span>
                  {value === option ? <Check className="size-4" aria-hidden="true" /> : null}
                </button>
              </PopoverClose>
            ))
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">No universities found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RangeFilter({
  label,
  min,
  max,
  bounds,
  formatValue,
  onCommit,
}: {
  label: string;
  min: number | null;
  max: number | null;
  bounds: UserRangeBounds;
  formatValue: (value: number) => string;
  onCommit: (min: number | null, max: number | null) => void;
}) {
  const currentMin = min ?? bounds.min;
  const currentMax = max ?? bounds.max;
  const sliderKey = `${currentMin}-${currentMax}-${bounds.min}-${bounds.max}-${bounds.step}`;

  return (
    <div className="flex min-w-56 flex-col gap-2 rounded-md border border-border/70 bg-background/50 px-3 py-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {min === null && max === null
            ? "Any"
            : `${formatValue(currentMin)} – ${formatValue(currentMax)}`}
        </span>
      </div>
      <Slider
        key={sliderKey}
        aria-label={label}
        defaultValue={[currentMin, currentMax]}
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        minStepsBetweenThumbs={0}
        onValueCommit={(values) => {
          const nextMin = values[0] === bounds.min ? null : (values[0] ?? bounds.min);
          const nextMax = values[1] === bounds.max ? null : (values[1] ?? bounds.max);
          onCommit(nextMin, nextMax);
        }}
      >
        <SliderThumb aria-label={`${label} minimum`} />
        <SliderThumb aria-label={`${label} maximum`} />
      </Slider>
    </div>
  );
}

function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex min-w-64 flex-col gap-1.5 rounded-md border border-border/70 bg-background/50 px-3 py-2">
      <legend className="text-xs font-medium text-foreground">Registered between</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <span>From</span>
          <Input
            type="date"
            aria-label="Registered from"
            value={from}
            max={to || undefined}
            onChange={(event) => onFromChange(event.currentTarget.value)}
            className="h-8 px-2 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <span>To</span>
          <Input
            type="date"
            aria-label="Registered to"
            value={to}
            min={from || undefined}
            onChange={(event) => onToChange(event.currentTarget.value)}
            className="h-8 px-2 text-xs"
          />
        </label>
      </div>
    </fieldset>
  );
}

function BooleanFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent focus-within:bg-accent">
      <Checkbox
        aria-label={label}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span>{label}</span>
    </label>
  );
}

interface ActiveFilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

function ActiveFilters({
  filters,
  onFiltersChange,
  onClearAll,
}: Pick<UserFilterBarProps, "filters" | "onFiltersChange" | "onClearAll">) {
  const update = <TKey extends keyof UserFilters>(key: TKey, value: UserFilters[TKey]) =>
    updateFilter(onFiltersChange, key, value);

  const removeArrayValue = <TKey extends ArrayFilterKey>(key: TKey, value: string) => {
    const next = (filters[key] as readonly string[]).filter((item) => item !== value);
    update(key, next as UserFilters[TKey]);
  };

  const chips: ActiveFilterChip[] = [
    ...filters.status.map((value) => ({
      id: `status-${value}`,
      label: "Status",
      value: labelForFilterValue(value),
      onRemove: () => removeArrayValue("status", value),
    })),
    ...(filters.emailVerified !== "ANY"
      ? [
          {
            id: "email-verified",
            label: "Email",
            value: filters.emailVerified === "VERIFIED" ? "Verified" : "Unverified",
            onRemove: () => update("emailVerified", "ANY"),
          },
        ]
      : []),
    ...filters.workStatus.map((value) => ({
      id: `work-status-${value}`,
      label: "Work status",
      value: labelForFilterValue(value),
      onRemove: () => removeArrayValue("workStatus", value),
    })),
    ...(filters.university
      ? [
          {
            id: "university",
            label: "University",
            value: filters.university,
            onRemove: () => update("university", ""),
          },
        ]
      : []),
    ...filters.gender.map((value) => ({
      id: `gender-${value}`,
      label: "Gender",
      value: labelForFilterValue(value),
      onRemove: () => removeArrayValue("gender", value),
    })),
    ...filters.language.map((value) => ({
      id: `language-${value}`,
      label: "Language",
      value: labelForFilterValue(value),
      onRemove: () => removeArrayValue("language", value),
    })),
    ...filters.authProvider.map((value) => ({
      id: `auth-provider-${value}`,
      label: "Provider",
      value: labelForFilterValue(value),
      onRemove: () => removeArrayValue("authProvider", value),
    })),
    ...(filters.levelMin !== null || filters.levelMax !== null
      ? [
          {
            id: "level-range",
            label: "Level",
            value: `${filters.levelMin ?? "min"}–${filters.levelMax ?? "max"}`,
            onRemove: () =>
              onFiltersChange((previous) => ({ ...previous, levelMin: null, levelMax: null })),
          },
        ]
      : []),
    ...(filters.xpMin !== null || filters.xpMax !== null
      ? [
          {
            id: "xp-range",
            label: "XP",
            value: `${filters.xpMin ?? "min"}–${filters.xpMax ?? "max"}`,
            onRemove: () =>
              onFiltersChange((previous) => ({ ...previous, xpMin: null, xpMax: null })),
          },
        ]
      : []),
    ...(filters.createdFrom || filters.createdTo
      ? [
          {
            id: "created-range",
            label: "Registered",
            value: `${filters.createdFrom || "any"}–${filters.createdTo || "any"}`,
            onRemove: () =>
              onFiltersChange((previous) => ({ ...previous, createdFrom: "", createdTo: "" })),
          },
        ]
      : []),
    ...(filters.lastActive
      ? [
          {
            id: "last-active",
            label: "Last active",
            value: filters.lastActive,
            onRemove: () => update("lastActive", ""),
          },
        ]
      : []),
    ...(filters.banned
      ? [
          {
            id: "banned",
            label: "Account",
            value: "Has active ban",
            onRemove: () => update("banned", false),
          },
        ]
      : []),
    ...(filters.includeDeleted
      ? [
          {
            id: "include-deleted",
            label: "Accounts",
            value: "Include deleted",
            onRemove: () => update("includeDeleted", false),
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="region" aria-label="Active filters">
      <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
      {chips.map((chip) => (
        <Badge key={chip.id} variant="secondary" className="gap-1 pr-1">
          <span>
            {chip.label}: {chip.value}
          </span>
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter ${chip.value}`}
            onClick={chip.onRemove}
            className="rounded-full p-0.5 outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
      <Button type="button" variant="ghost" size="xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}

export function UserFilterBar({
  filters,
  onFiltersChange,
  onClearAll,
  universityOptions = [],
  universityLoading = false,
  universityQuery,
  onUniversityQueryChange,
  levelBounds = DEFAULT_USER_LEVEL_BOUNDS,
  xpBounds = DEFAULT_USER_XP_BOUNDS,
  className,
}: UserFilterBarProps) {
  const update = <TKey extends keyof UserFilters>(key: TKey, value: UserFilters[TKey]) =>
    updateFilter(onFiltersChange, key, value);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2" aria-label="User filters">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </div>

        <FacetFilter
          label="Status"
          options={USER_FILTER_OPTIONS.status}
          selected={filters.status}
          onChange={(value) => update("status", value)}
        />
        <SelectFilter
          label="Email verification"
          value={filters.emailVerified}
          options={[
            { value: "ANY", label: "Any verification" },
            { value: "VERIFIED", label: "Verified" },
            { value: "UNVERIFIED", label: "Unverified" },
          ] satisfies ReadonlyArray<{ value: UserEmailVerificationState; label: string }>}
          onChange={(value) => update("emailVerified", value)}
        />
        <FacetFilter
          label="Work status"
          options={USER_FILTER_OPTIONS.workStatus}
          selected={filters.workStatus}
          onChange={(value) => update("workStatus", value)}
        />
        <UniversityFilter
          value={filters.university}
          options={universityOptions}
          loading={universityLoading}
          query={universityQuery}
          onQueryChange={onUniversityQueryChange}
          onChange={(value) => update("university", value)}
        />
        <FacetFilter
          label="Gender"
          options={USER_FILTER_OPTIONS.gender}
          selected={filters.gender}
          onChange={(value) => update("gender", value)}
        />
        <FacetFilter
          label="Language"
          options={USER_FILTER_OPTIONS.language}
          selected={filters.language}
          onChange={(value) => update("language", value)}
        />
        <FacetFilter
          label="Auth provider"
          options={USER_FILTER_OPTIONS.authProvider}
          selected={filters.authProvider}
          onChange={(value) => update("authProvider", value)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <RangeFilter
          label="Level range"
          min={filters.levelMin}
          max={filters.levelMax}
          bounds={levelBounds}
          formatValue={(value) => String(value)}
          onCommit={(min, max) => {
            onFiltersChange((previous) => ({ ...previous, levelMin: min, levelMax: max }));
          }}
        />
        <RangeFilter
          label="XP range"
          min={filters.xpMin}
          max={filters.xpMax}
          bounds={xpBounds}
          formatValue={(value) => INTEGER_FORMATTER.format(value)}
          onCommit={(min, max) => {
            onFiltersChange((previous) => ({ ...previous, xpMin: min, xpMax: max }));
          }}
        />
        <DateRangeFilter
          from={filters.createdFrom}
          to={filters.createdTo}
          onFromChange={(value) => update("createdFrom", value)}
          onToChange={(value) => update("createdTo", value)}
        />
        <SelectFilter
          label="Last active"
          value={filters.lastActive}
          options={USER_LAST_ACTIVE_OPTIONS}
          onChange={(value) => update("lastActive", value as UserLastActivePreset)}
        />
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border/70 bg-background/50 p-1">
          <BooleanFilter
            label="Has active ban"
            checked={filters.banned}
            onChange={(value) => update("banned", value)}
          />
          <BooleanFilter
            label="Include deleted users"
            checked={filters.includeDeleted}
            onChange={(value) => update("includeDeleted", value)}
          />
        </div>
      </div>

      <ActiveFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearAll={onClearAll}
      />
    </div>
  );
}

export type {
  UserStatus,
  UserWorkStatus,
  UserGender,
  UserLanguage,
  UserAuthProvider,
};
