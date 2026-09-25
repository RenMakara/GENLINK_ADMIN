import { LockKeyhole } from "lucide-react";

import type { DataTableColumnDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { AdminRoleSummary } from "@/types/admin-role";

const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");

function RoleIdentityCell({ role }: { role: AdminRoleSummary }) {
  return (
    <div className="flex min-w-44 flex-col gap-0.5">
      <span className="font-medium text-foreground">{role.name}</span>
      <code className="text-xs text-muted-foreground">{role.code}</code>
    </div>
  );
}

function DescriptionCell({ description }: { description: string | null }) {
  return (
    <span className="block max-w-2xl truncate" title={description ?? undefined}>
      {description || "No description"}
    </span>
  );
}

function RoleTypeCell({ role }: { role: AdminRoleSummary }) {
  return role.isSystem ? (
    <Badge variant="outline" title="System role cannot be deleted">
      <LockKeyhole aria-hidden="true" />
      System
    </Badge>
  ) : (
    <Badge variant="secondary">Custom</Badge>
  );
}

/** Feature-owned columns for the ADM-107 roles list. */
export function createRoleTableColumns(): DataTableColumnDef<AdminRoleSummary>[] {
  return [
    {
      accessorKey: "name",
      header: "Role",
      enableSorting: false,
      cell: ({ row }) => <RoleIdentityCell role={row.original} />,
    },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => <DescriptionCell description={row.original.description} />,
    },
    {
      accessorKey: "adminCount",
      header: "Admins",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums whitespace-nowrap">
          {INTEGER_FORMATTER.format(row.original.adminCount)}
        </span>
      ),
    },
    {
      accessorKey: "isSystem",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <RoleTypeCell role={row.original} />,
    },
  ];
}
