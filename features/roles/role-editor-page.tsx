"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, LockKeyhole, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { ConfirmDialog, EmptyState, ErrorState, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permission";
import { ApiError } from "@/lib/api/errors";
import {
  useAdminPermissionGroups,
  useAdminRole,
  useReplaceAdminRolePermissions,
} from "@/services/roles";
import type { AdminPermissionGroup, AdminRoleDetail } from "@/types/admin-role";

import { PermissionMatrix } from "./permission-matrix";
import { RoleEditorPageSkeleton } from "./role-editor-page-skeleton";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";

function errorMessage(error: unknown, subject: string): { title: string; description: string } {
  if (error instanceof ApiError && error.status === 404) {
    return {
      title: "Role not found",
      description: "This role may have been removed or is no longer available.",
    };
  }
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return {
      title: "Permission matrix unavailable",
      description: "You do not have permission to view administrator roles.",
    };
  }
  if (error instanceof ApiError && error.status === 0) {
    return {
      title: `${subject} service unavailable`,
      description: `The ${subject.toLowerCase()} service is unavailable. Check the API connection and try again.`,
    };
  }
  return {
    title: `Could not load ${subject.toLowerCase()}`,
    description: `We could not load ${subject.toLowerCase()} right now. Please try again.`,
  };
}

function updateErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return error.needsSudo
      ? "Additional verification is required before this permission change can be saved."
      : "You are not authorized to change this role's permissions.";
  }
  if (error instanceof ApiError && error.status === 400) {
    return "The permission set was not accepted. Refresh the role and try again.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "This role no longer exists. Nothing was changed.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The Roles service is unavailable. Nothing was changed.";
  }
  return "The permission change could not be saved. Nothing was changed.";
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

function RoleIdentity({ role }: { role: AdminRoleDetail }) {
  return (
    <Card className="overflow-visible">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{role.name}</CardTitle>
              <Badge variant="outline">
                <code>{role.code}</code>
              </Badge>
              {role.isSystem ? (
                <Badge variant="secondary">
                  <LockKeyhole aria-hidden="true" />
                  System role
                </Badge>
              ) : (
                <Badge variant="secondary">Custom role</Badge>
              )}
            </div>
            <CardDescription className="mt-2">
              {role.description || "No description has been provided for this role."}
            </CardDescription>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{role.adminCount}</span>{" "}
            {role.adminCount === 1 ? "administrator" : "administrators"}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}

function RolePermissionEditor({
  role,
  groups,
  canManage,
}: {
  role: AdminRoleDetail;
  groups: AdminPermissionGroup[];
  canManage: boolean;
}) {
  const router = useRouter();
  const updatePermissions = useReplaceAdminRolePermissions();
  const [selectedPermissions, setSelectedPermissions] = useState(
    () => new Set(role.permissions),
  );
  const [savedPermissions, setSavedPermissions] = useState(
    () => new Set(role.permissions),
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const canEdit = canManage && role.code !== "SUPER_ADMIN";
  const isDirty = !sameSet(selectedPermissions, savedPermissions);
  const { confirmNavigation } = useUnsavedChangesGuard(isDirty);

  const allCodes = useMemo(
    () => groups.flatMap((group) => group.permissions.map((permission) => permission.code)),
    [groups],
  );
  const orderedSelectedPermissions = useMemo(
    () => allCodes.filter((code) => selectedPermissions.has(code)),
    [allCodes, selectedPermissions],
  );
  const selectedCount = orderedSelectedPermissions.length;

  const togglePermission = (code: string, checked: boolean) => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const toggleGroup = (codes: string[], checked: boolean) => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      for (const code of codes) {
        if (checked) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  };

  const handleSave = async (reason: string) => {
    const updatedRole = await updatePermissions.mutateAsync({
      roleId: role.roleId,
      permissions: orderedSelectedPermissions,
      reason,
    });
    const next = new Set(updatedRole.permissions);
    setSavedPermissions(next);
    setSelectedPermissions(next);
  };

  const readOnlyMessage = role.code === "SUPER_ADMIN"
    ? "SUPER_ADMIN permissions are implicit in the application and cannot be edited."
    : "Your administrator role has read-only access. The rbac:manage permission is required to edit this matrix.";

  return (
    <>
      <PageHeader
        title="Role editor"
        description="Review and manage the permissions assigned to this administrator role."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => confirmNavigation(() => router.push("/roles"))}
            >
              <ArrowLeft aria-hidden="true" />
              Back to roles
            </Button>
            <Button
              type="button"
              onClick={() => setSaveDialogOpen(true)}
              disabled={!canEdit || !isDirty || updatePermissions.isPending}
              title={!canEdit ? "You do not have permission to edit this role" : undefined}
            >
              <Save aria-hidden="true" />
              Save permissions
            </Button>
          </div>
        }
      />

      <RoleIdentity role={role} />

      {!canEdit ? (
        <div
          role="status"
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        >
          {readOnlyMessage}
        </div>
      ) : null}

      <section aria-labelledby="permission-matrix-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="permission-matrix-heading" className="text-lg font-semibold tracking-tight">
              Permission matrix
            </h2>
            <p className="text-sm text-muted-foreground">
              Select the capabilities this role may use. Changes replace the complete set in one audited action.
            </p>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">{selectedCount}</span> of {allCodes.length} selected
            {isDirty ? " · Unsaved changes" : ""}
          </p>
        </div>

        <PermissionMatrix
          groups={groups}
          selectedPermissions={selectedPermissions}
          disabled={!canEdit}
          onTogglePermission={togglePermission}
          onToggleGroup={toggleGroup}
        />
      </section>

      <ConfirmDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        tier="medium"
        title="Save permission changes?"
        description={`Update the permissions assigned to ${role.name}.`}
        consequence="The selected permissions will replace the role's current set and the change will be written to the admin audit log."
        confirmLabel="Save permissions"
        pending={updatePermissions.isPending}
        errorMessageFor={updateErrorMessage}
        onConfirm={handleSave}
      />
    </>
  );
}

export function RoleEditorPage({ roleId }: { roleId: string }) {
  const { has, ready } = usePermissions();
  const canRead = ready && has("rbac:read");
  const canManage = ready && has("rbac:manage");
  const roleQuery = useAdminRole(roleId, canRead);
  const permissionQuery = useAdminPermissionGroups(canRead);

  if (!ready) {
    return <RoleEditorPageSkeleton />;
  }

  if (!canRead) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader title="Role editor" description="Review administrator permissions." />
        <ErrorState
          title="Access restricted"
          description="You do not have permission to view administrator roles."
        />
      </div>
    );
  }

  if (roleQuery.isLoading || permissionQuery.isLoading) {
    return <RoleEditorPageSkeleton />;
  }

  if (roleQuery.isError || !roleQuery.data) {
    const message = errorMessage(roleQuery.error, "role details");
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader title="Role editor" description="Review administrator permissions." />
        <ErrorState
          title={message.title}
          description={message.description}
          onRetry={() => void roleQuery.refetch()}
        />
      </div>
    );
  }

  if (permissionQuery.isError || !permissionQuery.data) {
    const message = errorMessage(permissionQuery.error, "permission catalogue");
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader title="Role editor" description="Review administrator permissions." />
        <ErrorState
          title={message.title}
          description={message.description}
          onRetry={() => void permissionQuery.refetch()}
        />
      </div>
    );
  }

  if (permissionQuery.data.length === 0) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader title="Role editor" description="Review administrator permissions." />
        <EmptyState
          title="No permissions available"
          description="The permission catalogue returned no editable capabilities."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <RolePermissionEditor
        key={roleQuery.data.roleId}
        role={roleQuery.data}
        groups={permissionQuery.data}
        canManage={canManage}
      />
    </div>
  );
}
