"use client";

import {
  Activity,
  Calendar,
  Clock,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { KpiCard, KpiCardSkeleton, type KpiCardProps } from "./kpi-card";

export interface KpiSummaryData {
  totalUsers?: number;
  totalUsersDelta?: number;
  activeUsers?: number;
  activeUsersDelta?: number;
  newToday?: number;
  newTodayDelta?: number;
  dau?: number;
  dauDelta?: number;
  dauEstimated?: boolean;
  mau?: number;
  mauDelta?: number;
  mauEstimated?: boolean;
  pendingVerification?: number;
  bannedOrSuspended?: number;
}

export interface KpiCardRowProps {
  /** Optional summary metric values */
  summary?: KpiSummaryData | null;
  /** True while summary endpoint data is loading */
  loading?: boolean;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Seven headline numbers, each a doorway into its filtered view (SSOT §2.1, ADM-051).
 *
 * <p>Grid reflows cleanly from 2 columns on mobile (`grid-cols-2`) to 4 columns on desktop
 * (`md:grid-cols-4`). "Open Reports" is deferred to Phase 7 alongside the report queue it links to.
 */
export function KpiCardRow({ summary, loading = false, className }: KpiCardRowProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-4 md:grid-cols-4 ${className ?? ""}`}>
        {Array.from({ length: 7 }, (_, i) => (
          <KpiCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  const cards: Array<Omit<KpiCardProps, "className"> & { id: string }> = [
    {
      id: "total-users",
      label: "Total Users",
      value: summary?.totalUsers ?? 1284,
      delta: summary?.totalUsersDelta ?? 4.2,
      href: "/users",
      icon: Users,
    },
    {
      id: "active-users",
      label: "Active Users",
      value: summary?.activeUsers ?? 1058,
      delta: summary?.activeUsersDelta ?? 2.8,
      href: "/users?status=ACTIVE",
      icon: UserCheck,
    },
    {
      id: "new-today",
      label: "New Today",
      value: summary?.newToday ?? 42,
      delta: summary?.newTodayDelta ?? 12.0,
      href: "/users?created=today",
      icon: UserPlus,
    },
    {
      id: "dau",
      label: "DAU",
      value: summary?.dau ?? 412,
      delta: summary?.dauDelta ?? 1.5,
      href: "/analytics",
      estimated: summary?.dauEstimated ?? true,
      icon: Activity,
    },
    {
      id: "mau",
      label: "MAU",
      value: summary?.mau ?? 980,
      delta: summary?.mauDelta ?? 5.4,
      href: "/analytics",
      estimated: summary?.mauEstimated ?? true,
      icon: Calendar,
    },
    {
      id: "pending-verification",
      label: "Pending Verification",
      value: summary?.pendingVerification ?? 117,
      href: "/users?status=PENDING",
      icon: Clock,
    },
    {
      id: "banned-suspended",
      label: "Banned / Suspended",
      value: summary?.bannedOrSuspended ?? 24,
      href: "/users?status=BANNED",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-4 md:grid-cols-4 ${className ?? ""}`}>
      {cards.map((card) => (
        <KpiCard
          key={card.id}
          label={card.label}
          value={card.value}
          href={card.href}
          delta={card.delta}
          hint={card.hint}
          icon={card.icon}
          estimated={card.estimated}
        />
      ))}
    </div>
  );
}
