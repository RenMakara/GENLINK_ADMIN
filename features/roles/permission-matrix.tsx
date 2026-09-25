"use client";

import type { ReactNode } from "react";
import { Check, Minus } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AdminPermissionGroup } from "@/types/admin-role";

export type GroupSelectionState = boolean | "indeterminate";

interface PermissionMatrixProps {
  groups: AdminPermissionGroup[];
  selectedPermissions: ReadonlySet<string>;
  disabled?: boolean;
  emptyState?: ReactNode;
  onTogglePermission: (code: string, checked: boolean) => void;
  onToggleGroup: (codes: string[], checked: boolean) => void;
}

/** Returns the accessible checked state for a resource-level master checkbox. */
export function groupSelectionState(
  codes: readonly string[],
  selectedPermissions: ReadonlySet<string>,
): GroupSelectionState {
  const selectedCount = codes.filter((code) => selectedPermissions.has(code)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === codes.length) return true;
  return "indeterminate";
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resourceLabel(resource: string): string {
  if (resource.toLowerCase() === "xp") return "XP";
  return titleCase(resource);
}

function actionLabel(action: string): string {
  return action
    .split(":")
    .map((part) => titleCase(part))
    .join(" / ");
}

function GroupCheckboxIcon({ checked }: { checked: GroupSelectionState }) {
  if (checked === "indeterminate") {
    return <Minus aria-hidden="true" />;
  }
  return checked ? <Check aria-hidden="true" /> : null;
}

/**
 * Accessible permission matrix primitives for ADM-108.
 *
 * <p>The component owns only the matrix presentation and checkbox semantics. The role editor
 * owns the selected set, dirty state, save flow, and authorization decisions.
 */
export function PermissionMatrix({
  groups,
  selectedPermissions,
  disabled = false,
  emptyState,
  onTogglePermission,
  onToggleGroup,
}: PermissionMatrixProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        {emptyState ?? (
          <p className="text-sm text-muted-foreground">No permissions are available.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-label="Permission groups">
      {groups.map((group) => {
        const codes = group.permissions.map((permission) => permission.code);
        const groupState = groupSelectionState(codes, selectedPermissions);
        const groupId = `permission-group-${group.resource}`;

        return (
          <fieldset
            key={group.resource}
            className="rounded-xl border border-border bg-card p-4 text-card-foreground"
            disabled={disabled}
            aria-labelledby={`${groupId}-legend`}
          >
            <legend id={`${groupId}-legend`} className="-ml-1 px-1 text-sm font-semibold">
              {resourceLabel(group.resource)}
            </legend>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <Checkbox
                  id={`${groupId}-all`}
                  checked={groupState}
                  disabled={disabled}
                  onCheckedChange={(checked) => onToggleGroup(codes, checked === true)}
                  aria-label={`Grant all ${resourceLabel(group.resource)} permissions`}
                >
                  <GroupCheckboxIcon checked={groupState} />
                </Checkbox>
                <Label htmlFor={`${groupId}-all`} className="cursor-pointer">
                  Grant all
                </Label>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {codes.filter((code) => selectedPermissions.has(code)).length}/{codes.length}
                <span className="sr-only"> permissions selected</span>
              </span>
            </div>

            <div className="flex flex-col divide-y divide-border">
              {group.permissions.map((permission) => {
                const checkboxId = `${groupId}-${permission.code.replace(/[^a-zA-Z0-9]+/g, "-")}`;
                const descriptionId = `${checkboxId}-description`;

                return (
                  <div key={permission.code} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <Checkbox
                      id={checkboxId}
                      checked={selectedPermissions.has(permission.code)}
                      disabled={disabled}
                      aria-label={`${actionLabel(permission.action)} permission (${permission.code})`}
                      onCheckedChange={(checked) =>
                        onTogglePermission(permission.code, checked === true)
                      }
                      aria-describedby={descriptionId}
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={checkboxId} className="cursor-pointer gap-1.5">
                        <span>{actionLabel(permission.action)}</span>
                        <code className="text-xs font-normal text-muted-foreground">
                          {permission.code}
                        </code>
                      </Label>
                      <p id={descriptionId} className={cn("mt-1 text-xs text-muted-foreground")}>
                        {permission.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
