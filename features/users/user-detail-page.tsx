"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState, ErrorState, PageHeader, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatRelative } from "@/lib/utils/date";
import { useUserDetail } from "@/services/users";

import {
  DEFAULT_USER_DETAIL_TAB,
  isUserDetailTab,
  userDetailTabLabel,
  UserDetailTabs,
  type UserDetailTab,
} from "./user-detail-tabs";
import { UserAccountTab, UserActivityTab, UserProfileTab } from "./user-detail-panels";
import {
  UserLoginHistoryTab,
  UserSessionsTab,
  UserXpTab,
} from "./user-detail-security-panels";
import { UserEnforcementTab } from "./user-enforcement-tab";
import { UserDetailPageSkeleton } from "./user-detail-page-skeleton";
import { UserActionCluster, type UserAction } from "./user-action-cluster";
import { UserNoteDialog } from "./user-note-dialog";
import { useUserNote } from "./user-note";
import { UserNotesTab } from "./user-notes-tab";
import {
  useUserEnforcement,
  type UserEnforcementAction,
} from "./user-enforcement";
import { UserEnforcementDialogs } from "./user-enforcement-dialogs";
import { UserRecoveryDialogs } from "./user-recovery-dialogs";
import { useUserRecovery, type UserRecoveryAction } from "./user-recovery";
import { UserLifecycleDialogs } from "./user-lifecycle-dialogs";
import { useUserLifecycle, type UserLifecycleAction } from "./user-lifecycle";
import { UserXpAdjustmentDialogs } from "./user-xp-adjustment-dialogs";
import { useUserXpAdjustment, type UserXpAdjustmentAction } from "./user-xp-adjustment";
import { UserWarningDialog } from "./user-warning-dialog";
import { useUserWarning } from "./user-warning";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function UserAvatar({ fullName, avatarUrl }: { fullName: string; avatarUrl: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span
      aria-hidden="true"
      className="bg-accent text-accent-foreground flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold ring-1 ring-foreground/10"
    >
      {avatarUrl && !imageFailed ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(fullName)
      )}
    </span>
  );
}

function detailErrorMessage(error: unknown): { title: string; description: string } {
  if (error instanceof ApiError && error.status === 404) {
    return {
      title: "User not found",
      description: "This user record may have been removed or is no longer available.",
    };
  }
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return {
      title: "User details unavailable",
      description: "You do not have permission to view this user record.",
    };
  }
  if (error instanceof ApiError && error.status === 0) {
    return {
      title: "User service unavailable",
      description: "The Users service is unavailable. Check the API connection and try again.",
    };
  }
  return {
    title: "Could not load user details",
    description: "We could not load this user record right now. Please try again.",
  };
}

export function UserDetailPage({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userQuery = useUserDetail(userId);
  const [enforcementAction, setEnforcementAction] = useState<UserEnforcementAction | null>(null);
  const [recoveryAction, setRecoveryAction] = useState<UserRecoveryAction | null>(null);
  const [lifecycleAction, setLifecycleAction] = useState<UserLifecycleAction | null>(null);
  const [xpAction, setXpAction] = useState<UserXpAdjustmentAction | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const enforcement = useUserEnforcement(userId);
  const recovery = useUserRecovery(userId);
  const lifecycle = useUserLifecycle(userId);
  const xpAdjustment = useUserXpAdjustment(userId);
  const warning = useUserWarning(userId);
  const note = useUserNote(userId);

  const handleUserAction = useCallback((action: UserAction) => {
    if (action === "ban" || action === "unban" || action === "suspend") {
      setEnforcementAction(action);
      setRecoveryAction(null);
      setLifecycleAction(null);
      setXpAction(null);
      setWarningOpen(false);
      setNoteOpen(false);
      return;
    }

    if (action === "verify-email" || action === "reset-password" || action === "force-logout") {
      setRecoveryAction(action);
      setEnforcementAction(null);
      setLifecycleAction(null);
      setXpAction(null);
      setWarningOpen(false);
      setNoteOpen(false);
      return;
    }

    if (action === "delete" || action === "restore") {
      setLifecycleAction(action);
      setEnforcementAction(null);
      setRecoveryAction(null);
      setXpAction(null);
      setWarningOpen(false);
      setNoteOpen(false);
      return;
    }

    if (action === "grant-xp" || action === "revoke-xp") {
      setXpAction(action);
      setEnforcementAction(null);
      setRecoveryAction(null);
      setLifecycleAction(null);
      setWarningOpen(false);
      setNoteOpen(false);
      return;
    }

    if (action === "warn") {
      setWarningOpen(true);
      setNoteOpen(false);
      setEnforcementAction(null);
      setRecoveryAction(null);
      setLifecycleAction(null);
      setXpAction(null);
      return;
    }

    if (action === "add-note") {
      setNoteOpen(true);
      setWarningOpen(false);
      setEnforcementAction(null);
      setRecoveryAction(null);
      setLifecycleAction(null);
      setXpAction(null);
    }
  }, []);

  const rawTab = searchParams.get("tab");
  const activeTab: UserDetailTab = isUserDetailTab(rawTab)
    ? rawTab
    : DEFAULT_USER_DETAIL_TAB;

  const setActiveTab = useCallback(
    (tab: UserDetailTab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (tab === DEFAULT_USER_DETAIL_TAB) nextParams.delete("tab");
      else nextParams.set("tab", tab);

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const backToUsers = useCallback(() => {
    router.push("/users");
  }, [router]);

  if (userQuery.isLoading) {
    return <UserDetailPageSkeleton />;
  }

  if (userQuery.isError || !userQuery.data) {
    const message = detailErrorMessage(userQuery.error);

    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader
          title="User details"
          description="Inspect a GenLink KH account."
          actions={
            <Button type="button" variant="outline" onClick={backToUsers}>
              <ArrowLeft aria-hidden="true" />
              Back to users
            </Button>
          }
        />
        <ErrorState
          title={message.title}
          description={message.description}
          onRetry={() => void userQuery.refetch()}
        />
      </div>
    );
  }

  const user = userQuery.data;
  const joinedLabel = formatRelative(user.createdAt);
  const username = user.username ? `@${user.username.replace(/^@/, "")}` : "—";
  const tabLabel = userDetailTabLabel(activeTab);

  const tabContent =
    activeTab === "profile" ? (
      <UserProfileTab user={user} />
    ) : activeTab === "account" ? (
      <UserAccountTab user={user} />
      ) : activeTab === "activity" ? (
        <UserActivityTab userId={userId} />
      ) : activeTab === "xp" ? (
        <UserXpTab userId={userId} />
      ) : activeTab === "sessions" ? (
        <UserSessionsTab userId={userId} />
      ) : activeTab === "login-history" ? (
        <UserLoginHistoryTab userId={userId} />
      ) : activeTab === "enforcement" ? (
        <UserEnforcementTab userId={userId} />
      ) : activeTab === "notes" ? (
        <UserNotesTab userId={userId} onAddNote={() => setNoteOpen(true)} />
      ) : (
      <EmptyState
        title={`${tabLabel} tab ready`}
        description="This tab's data view will be added in its scheduled user-detail task."
        className="min-h-40"
      />
    );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="User details"
        description="Inspect a GenLink KH account. Detail tabs load as they are opened."
        actions={
          <Button type="button" variant="outline" onClick={backToUsers}>
            <ArrowLeft aria-hidden="true" />
            Back to users
          </Button>
        }
      />

      <Card aria-labelledby="user-detail-heading">
        <CardHeader className="gap-5 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} />
            <div className="min-w-48 flex-1">
              <h2 id="user-detail-heading" className="text-xl font-semibold tracking-tight">
                {user.fullName || "—"}
              </h2>
              <p className="text-sm text-muted-foreground">{username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={user.accountStatus} />
                {user.adminRoleName ? <Badge variant="outline">{user.adminRoleName}</Badge> : null}
                <time
                  dateTime={user.createdAt}
                  title={formatDateTime(user.createdAt)}
                  className="text-sm text-muted-foreground"
                >
                  Joined {joinedLabel}
                </time>
              </div>
            </div>

            <div
              role="img"
              aria-label={`Level ${user.level}`}
              className="border-primary text-primary flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-4 text-center"
            >
              <span className="text-[0.65rem] font-medium uppercase tracking-wide" aria-hidden="true">
                Lv
              </span>
              <span className="text-lg font-semibold leading-none">{user.level}</span>
            </div>

            <UserActionCluster user={user} onAction={handleUserAction} />
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4" aria-hidden="true" />
            <span>Selected account</span>
          </div>
          <UserDetailTabs activeTab={activeTab} onTabChange={setActiveTab}>
            {tabContent}
          </UserDetailTabs>
        </CardContent>
      </Card>

      <UserEnforcementDialogs
        user={user}
        action={enforcementAction}
        pendingAction={enforcement.pendingAction}
        onOpenChange={(open) => {
          if (!open) setEnforcementAction(null);
        }}
        onConfirm={(action, reason, durationHours) =>
          enforcement.execute({ action, reason, durationHours })
        }
      />

      <UserRecoveryDialogs
        user={user}
        action={recoveryAction}
        pendingAction={recovery.pendingAction}
        onOpenChange={(open) => {
          if (!open) setRecoveryAction(null);
        }}
        onConfirm={(action, reason) => recovery.execute({ action, reason })}
      />

      <UserLifecycleDialogs
        user={user}
        action={lifecycleAction}
        pendingAction={lifecycle.pendingAction}
        onOpenChange={(open) => {
          if (!open) setLifecycleAction(null);
        }}
        onConfirm={(action, reason) => lifecycle.execute({ action, reason })}
      />

      <UserXpAdjustmentDialogs
        user={user}
        action={xpAction}
        pendingAction={xpAdjustment.pendingAction}
        onOpenChange={(open) => {
          if (!open) setXpAction(null);
        }}
        onConfirm={(action, amount, reason) =>
          xpAdjustment.execute({ action, amount, reason })
        }
      />

      {warningOpen ? (
        <UserWarningDialog
          user={user}
          open
          pending={warning.pending}
          onOpenChange={(open) => {
            if (!open) setWarningOpen(false);
          }}
          onConfirm={(request) => warning.execute(request)}
        />
      ) : null}

      {noteOpen ? (
        <UserNoteDialog
          user={user}
          open
          pending={note.pending}
          onOpenChange={(open) => {
            if (!open) setNoteOpen(false);
          }}
          onConfirm={(noteText) => note.execute({ note: noteText })}
        />
      ) : null}
    </div>
  );
}
