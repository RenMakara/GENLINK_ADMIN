"use client";

import { ConfirmDialog } from "@/components/common";
import { userSanctionLiftErrorMessage } from "@/hooks/use-sanction-lift";
import type { AdminUserSanction } from "@/types/admin-sanction";

export interface UserSanctionLiftDialogProps {
  sanction: AdminUserSanction | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sanctionId: string, reason: string) => Promise<void>;
}

function typeLabel(type: AdminUserSanction["type"]): string {
  if (type === "BAN") return "ban";
  if (type === "SUSPENSION") return "suspension";
  return "warning";
}

function consequenceFor(sanction: AdminUserSanction): string {
  if (sanction.type === "BAN") {
    return "The ban will be marked lifted, and the server will restore the account status captured before it when valid.";
  }
  if (sanction.type === "SUSPENSION") {
    return "The suspension will be marked lifted, and the server will restore the account status captured before it when valid.";
  }
  return "The warning will be marked lifted in the enforcement history. This does not imply that a user notification was delivered.";
}

export function UserSanctionLiftDialog({
  sanction,
  pending,
  onOpenChange,
  onConfirm,
}: UserSanctionLiftDialogProps) {
  if (!sanction) return null;

  const label = typeLabel(sanction.type);
  const target = sanction.userFullName || "this user";

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      tier="medium"
      title={`Lift ${label} for ${target}?`}
      description="This closes the active enforcement record and records the reason in the audit log."
      consequence={consequenceFor(sanction)}
      confirmLabel="Lift sanction"
      destructive={false}
      pending={pending}
      errorMessageFor={userSanctionLiftErrorMessage}
      onConfirm={(reason) => onConfirm(sanction.sanctionId, reason)}
    />
  );
}
