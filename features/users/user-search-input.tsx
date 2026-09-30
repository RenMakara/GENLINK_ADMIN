"use client";

import { Search, X } from "lucide-react";
import { useId, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface UserSearchInputProps
  extends Omit<
    ComponentProps<"input">,
    "type" | "value" | "defaultValue" | "onChange" | "aria-label"
  > {
  /** The value exposed by useTableState, including its URL-restored draft. */
  value: string;
  /** Pass useTableState().setSearch so its 300 ms URL debounce remains centralized. */
  onValueChange: (value: string) => void;
  label?: string;
}

/** Search control; URL state and debouncing are owned by the table hook. */
export function UserSearchInput({
  value,
  onValueChange,
  label = "Search users",
  placeholder = "Search users…",
  className,
  id: providedId,
  ...inputProps
}: UserSearchInputProps) {
  const generatedId = useId();
  const inputId = providedId ?? generatedId;

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...inputProps}
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        className="h-9 pl-9 pr-9"
      />
      {value.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => onValueChange("")}
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
