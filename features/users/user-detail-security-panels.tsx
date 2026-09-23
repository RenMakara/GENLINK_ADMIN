"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheck,
  CircleX,
  Laptop,
  ShieldCheck,
} from "lucide-react";

import { BarChart } from "@/components/charts";
import { EmptyState, ErrorState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, type DataTableColumnDef } from "@/components/data-table";
import { formatDateTime, formatPrecise } from "@/lib/utils/date";
import {
  useUserLoginHistory,
  useUserSessions,
  useUserXp,
} from "@/services/users";

import type {
  AdminUserEarnedBadge,
  AdminUserLoginHistory,
  AdminUserSession,
  AdminUserXp,
  AdminUserXpLedgerEntry,
} from "./types";

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");

function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : INTEGER_FORMATTER.format(value);
}

function humanizeCode(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSignedXp(value: number): string {
  const formatted = formatNumber(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

function DateCell({ value, precise = false }: { value: string | null; precise?: boolean }) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  const formatted = precise ? formatPrecise(value) : formatDateTime(value);
  return (
    <time dateTime={value} title={formatted} className="whitespace-nowrap text-muted-foreground">
      {formatted}
    </time>
  );
}

function TextCell({ value, maxWidth = "max-w-56" }: { value: string | null; maxWidth?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  return (
    <span className={`block truncate ${maxWidth}`} title={value}>
      {value}
    </span>
  );
}

function UserAgentCell({ value }: { value: string | null }) {
  return <TextCell value={value} maxWidth="max-w-[20rem]" />;
}

function useDetailPagination() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(PAGE_SIZE_OPTIONS[0]);

  const setPageSize = (nextPageSize: number) => {
    setPageSizeState(nextPageSize);
    setPageIndex(0);
  };

  return { pageIndex, pageSize, setPageIndex, setPageSize };
}

function TableError({ description }: { description: string }) {
  return <span>{description}</span>;
}

const SESSION_COLUMNS: DataTableColumnDef<AdminUserSession>[] = [
  {
    accessorKey: "deviceInfo",
    header: "Device",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex min-w-36 items-center gap-2">
        <Laptop className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <TextCell value={row.original.deviceInfo} />
      </div>
    ),
  },
  {
    accessorKey: "ipAddress",
    header: "IP address",
    enableSorting: false,
    cell: ({ row }) => <TextCell value={row.original.ipAddress} maxWidth="max-w-40" />,
  },
  {
    accessorKey: "userAgent",
    header: "User agent",
    enableSorting: false,
    cell: ({ row }) => <UserAgentCell value={row.original.userAgent} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    accessorKey: "lastUsedAt",
    header: "Last used",
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.lastUsedAt} />,
  },
  {
    accessorKey: "expiresAt",
    header: "Expires",
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.expiresAt} />,
  },
];

/** ADM-075 Sessions tab. Revoke controls intentionally remain out of scope until Phase 4. */
export function UserSessionsTab({ userId }: { userId: string }) {
  const { pageIndex, pageSize, setPageIndex, setPageSize } = useDetailPagination();
  const sessionsQuery = useUserSessions(userId, pageIndex, pageSize);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Devices &amp; sessions</CardTitle>
          <CardDescription>
            Active, non-revoked sessions for this account. Session tokens are never displayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable
            data={sessionsQuery.data?.content ?? []}
            columns={SESSION_COLUMNS}
            getRowId={(row) => row.sessionId}
            ariaLabel="Active user sessions"
            caption="Active sessions for this user"
            pagination={{
              pageIndex,
              pageSize,
              totalRows: sessionsQuery.data?.totalElements ?? 0,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onPageIndexChange: setPageIndex,
              onPageSizeChange: setPageSize,
            }}
            loading={sessionsQuery.isLoading}
            loadingRowCount={5}
            error={
              sessionsQuery.isError ? (
                <TableError description="We could not load this user's active sessions right now." />
              ) : null
            }
            onRetry={() => void sessionsQuery.refetch()}
            emptyState={{
              title: "No active sessions",
              description: "This user has no active sessions to display.",
            }}
            stickyHeader
            className="min-w-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function LoginResult({ success }: { success: boolean }) {
  const Icon = success ? CircleCheck : CircleX;
  return (
    <span
      className={success ? "text-success" : "text-destructive"}
      aria-label={success ? "Login succeeded" : "Login failed"}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Icon className="size-4" aria-hidden="true" />
        <span>{success ? "Success" : "Failed"}</span>
      </span>
    </span>
  );
}

const LOGIN_HISTORY_COLUMNS: DataTableColumnDef<AdminUserLoginHistory>[] = [
  {
    accessorKey: "success",
    header: "Result",
    enableSorting: false,
    cell: ({ row }) => <LoginResult success={row.original.success} />,
  },
  {
    accessorKey: "eventType",
    header: "Event",
    enableSorting: false,
    cell: ({ row }) => <span>{humanizeCode(row.original.eventType)}</span>,
  },
  {
    accessorKey: "failureReason",
    header: "Failure reason",
    enableSorting: false,
    cell: ({ row }) => <TextCell value={row.original.failureReason} />,
  },
  {
    accessorKey: "ipAddress",
    header: "IP address",
    enableSorting: false,
    cell: ({ row }) => <TextCell value={row.original.ipAddress} maxWidth="max-w-40" />,
  },
  {
    accessorKey: "userAgent",
    header: "User agent",
    enableSorting: false,
    cell: ({ row }) => <UserAgentCell value={row.original.userAgent} />,
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.timestamp} precise />,
  },
];

/** ADM-075 Login history tab. Result text and icons keep failures distinguishable without colour. */
export function UserLoginHistoryTab({ userId }: { userId: string }) {
  const { pageIndex, pageSize, setPageIndex, setPageSize } = useDetailPagination();
  const historyQuery = useUserLoginHistory(userId, pageIndex, pageSize);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Login history</CardTitle>
        <CardDescription>
          Newest-first authentication events for this user. Failed attempts are retained for
          operational review.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <DataTable
          data={historyQuery.data?.content ?? []}
          columns={LOGIN_HISTORY_COLUMNS}
          getRowId={(row) => row.auditId}
          ariaLabel="User login history"
          caption="Login history for this user"
          pagination={{
            pageIndex,
            pageSize,
            totalRows: historyQuery.data?.totalElements ?? 0,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          loading={historyQuery.isLoading}
          loadingRowCount={6}
          error={
            historyQuery.isError ? (
              <TableError description="We could not load this user's login history right now." />
            ) : null
          }
          onRetry={() => void historyQuery.refetch()}
          emptyState={{
            title: "No login history",
            description: "No authentication events are available for this user.",
          }}
          stickyHeader
          className="min-w-0"
        />
      </CardContent>
    </Card>
  );
}

function XpProgress({ xp }: { xp: AdminUserXp }) {
  const progress = Math.max(0, Math.min(100, xp.levelProgressPercent));

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Level progress</CardTitle>
        <CardDescription>Current level and signed XP progress from the account ledger.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current level</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">Level {xp.level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total XP</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatNumber(xp.totalXp)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress to next level</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={`Level ${xp.level} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            data-testid="user-xp-progress"
            className="h-3 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{formatNumber(xp.xpIntoLevel)} XP in this level</span>
            <span>{formatNumber(xp.xpToNextLevel)} XP to next</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function XpBreakdown({ xp }: { xp: AdminUserXp }) {
  const breakdownData = xp.breakdown.map((item) => ({
    sourceType: humanizeCode(item.sourceType),
    xpAmount: item.xpAmount,
  }));
  const signedTotal = xp.breakdown.reduce((total, item) => total + item.xpAmount, 0);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>XP source breakdown</CardTitle>
        <CardDescription>
          Signed XP totals by source. The source totals sum to {formatSignedXp(signedTotal)} XP.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {breakdownData.length > 0 ? (
          <BarChart
            data={breakdownData}
            index="sourceType"
            categories={["xpAmount"]}
            showLegend={false}
            valueFormatter={formatSignedXp}
            height={260}
            className="min-h-64"
          />
        ) : (
          <EmptyState
            title="No XP sources"
            description="This user has no XP history available for a source breakdown."
          />
        )}
      </CardContent>
    </Card>
  );
}

function EarnedBadges({ badges }: { badges: AdminUserEarnedBadge[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Earned badges</CardTitle>
        <CardDescription>Badges unlocked by this user.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {badges.length === 0 ? (
          <EmptyState title="No earned badges" description="This user has not unlocked a badge yet." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <li key={badge.badgeId} className="rounded-lg border border-border p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium">{badge.nameEn || badge.code || "Badge"}</p>
                    {badge.nameKm ? (
                      <p lang="km" className="mt-1 text-sm leading-7">
                        {badge.nameKm}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Unlocked <DateCell value={badge.unlockedAt} />
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function XpAmountCell({ value }: { value: number }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : null;

  return (
    <span className="inline-flex items-center gap-1 font-medium tabular-nums">
      {Icon ? <Icon className={positive ? "size-4 text-success" : "size-4 text-destructive"} aria-hidden="true" /> : null}
      <span>{formatSignedXp(value)}</span>
    </span>
  );
}

const XP_LEDGER_COLUMNS: DataTableColumnDef<AdminUserXpLedgerEntry>[] = [
  {
    accessorKey: "sourceType",
    header: "Source",
    enableSorting: false,
    cell: ({ row }) => <Badge variant="outline">{humanizeCode(row.original.sourceType)}</Badge>,
  },
  {
    accessorKey: "sourceId",
    header: "Source ID",
    enableSorting: false,
    cell: ({ row }) => <TextCell value={row.original.sourceId} maxWidth="max-w-60" />,
  },
  {
    accessorKey: "xpAmount",
    header: "XP",
    enableSorting: false,
    cell: ({ row }) => <XpAmountCell value={row.original.xpAmount} />,
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.timestamp} precise />,
  },
];

function XpLedger({ xp, pagination }: { xp: AdminUserXp; pagination: ReturnType<typeof useDetailPagination> }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>XP ledger</CardTitle>
        <CardDescription>Newest-first XP entries. Positive and negative adjustments are preserved.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <DataTable
          data={xp.ledger.content}
          columns={XP_LEDGER_COLUMNS}
          getRowId={(row) => row.xpHistoryId}
          ariaLabel="User XP ledger"
          caption="XP ledger for this user"
          pagination={{
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            totalRows: xp.ledger.totalElements,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageIndexChange: pagination.setPageIndex,
            onPageSizeChange: pagination.setPageSize,
          }}
          emptyState={{
            title: "No XP entries",
            description: "This user has no XP ledger entries to display.",
          }}
          stickyHeader
          className="min-w-0"
        />
      </CardContent>
    </Card>
  );
}

function XpTabSkeleton() {
  return (
    <div role="status" aria-label="Loading XP data" className="grid gap-4 xl:grid-cols-2">
      <span className="sr-only">Loading XP data…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" aria-hidden="true" />
      ))}
    </div>
  );
}

/** ADM-075 XP tab: level progress, ADM-050 chart, badges and paginated ledger. */
export function UserXpTab({ userId }: { userId: string }) {
  const pagination = useDetailPagination();
  const xpQuery = useUserXp(userId, pagination.pageIndex, pagination.pageSize);

  if (xpQuery.isLoading) return <XpTabSkeleton />;

  if (xpQuery.isError || !xpQuery.data) {
    return (
      <ErrorState
        title="XP data unavailable"
        description="We could not load this user's level and XP history right now."
        onRetry={() => void xpQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <XpProgress xp={xpQuery.data} />
        <XpBreakdown xp={xpQuery.data} />
      </div>
      <EarnedBadges badges={xpQuery.data.badges} />
      <XpLedger xp={xpQuery.data} pagination={pagination} />
    </div>
  );
}
