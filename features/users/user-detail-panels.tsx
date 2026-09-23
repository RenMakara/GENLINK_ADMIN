"use client";

import type { ReactNode } from "react";
import {
  Activity,
  ExternalLink,
  FileText,
  GraduationCap,
  MessageSquare,
  Users,
} from "lucide-react";

import { ErrorState } from "@/components/common";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { useUserActivity } from "@/services/users";

import type { AdminUserActivity, AdminUserDetail } from "./types";

const EMPTY_VALUE = "—";

function containsKhmer(value: string): boolean {
  return /[\u1780-\u17ff]/u.test(value);
}

function humanizeCode(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function DisplayValue({ value, multiline = false }: { value: ReactNode; multiline?: boolean }) {
  if (value === null || value === undefined || value === "") {
    return <span aria-label="Not available">{EMPTY_VALUE}</span>;
  }

  const text = typeof value === "string" ? value : null;
  return (
    <span
      lang={text && containsKhmer(text) ? "km" : undefined}
      className={multiline ? "block whitespace-pre-wrap break-words leading-7" : "break-words"}
    >
      {value}
    </span>
  );
}

function DetailField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="min-w-0 border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={multiline ? "mt-1 text-sm" : "mt-1 text-sm font-medium"}>
        <DisplayValue value={value} multiline={multiline} />
      </dd>
    </div>
  );
}

function DetailCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid min-w-0 gap-x-6 gap-y-4 md:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function DateValue({ value, dateOnly = false }: { value: string | null; dateOnly?: boolean }) {
  if (!value) return null;
  return (
    <time dateTime={value} title={formatDateTime(value)}>
      {dateOnly ? formatDate(value) : formatDateTime(value)}
    </time>
  );
}

function SocialLinks({ links }: { links: AdminUserDetail["socialLinks"] }) {
  if (links.length === 0) return null;

  return (
    <ul className="flex min-w-0 flex-col gap-2">
      {links.map((link) => {
        const platform = humanizeCode(link.platform) ?? "Social link";
        return (
          <li key={`${link.platform}-${link.url}`} className="min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate">{platform}</span>
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <span className="mt-0.5 block break-all text-xs text-muted-foreground">{link.url}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Interests({ interests }: { interests: AdminUserDetail["interests"] }) {
  if (interests.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((interest) => (
        <Badge key={interest.interestId} variant="secondary" className="h-auto py-1">
          <span lang={containsKhmer(interest.name) ? "km" : undefined}>{interest.name}</span>
          {interest.category ? (
            <span className="text-muted-foreground">· {humanizeCode(interest.category)}</span>
          ) : null}
        </Badge>
      ))}
    </div>
  );
}

export function UserProfileTab({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <DetailCard title="Profile information" description="Identity and personal details supplied by the user.">
        <DetailField label="Full name" value={user.fullName} />
        <DetailField label="Username" value={user.username ? `@${user.username.replace(/^@/, "")}` : null} />
        <DetailField label="Date of birth" value={<DateValue value={user.dateOfBirth} dateOnly />} />
        <DetailField label="Gender" value={humanizeCode(user.gender)} />
        <DetailField label="Phone" value={user.phoneNumber} />
        <DetailField label="Location" value={user.location} />
        <DetailField label="University" value={user.universityName} />
        <DetailField label="Work status" value={humanizeCode(user.workStatus)} />
        <DetailField label="Preferred language" value={humanizeCode(user.preferredLanguage)} />
        <DetailField label="Cover preset" value={user.coverPreset} />
        <div className="md:col-span-2">
          <DetailField label="Bio" value={user.bio} multiline />
        </div>
      </DetailCard>

      <DetailCard title="Interests and links" description="Public profile connections and portfolio summary.">
        <div className="md:col-span-2">
          <DetailField label="Interests" value={<Interests interests={user.interests} />} />
        </div>
        <div className="md:col-span-2">
          <DetailField label="Social links" value={<SocialLinks links={user.socialLinks} />} />
        </div>
        <DetailField label="Portfolio items" value={formatNumber(user.portfolioCount)} />
      </DetailCard>
    </div>
  );
}

export function UserAccountTab({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <DetailCard title="Sign-in and verification" description="Authentication state without exposing credentials or provider identifiers.">
        <DetailField label="Email" value={user.email} />
        <DetailField
          label="Email verification"
          value={
            <Badge variant={user.emailVerified ? "default" : "secondary"}>
              {user.emailVerified ? "Verified" : "Not verified"}
            </Badge>
          }
        />
        <DetailField label="Auth provider" value={humanizeCode(user.authProvider)} />
        <DetailField
          label="Google linked"
          value={
            <Badge variant={user.googleLinked ? "default" : "secondary"}>
              {user.googleLinked ? "Linked" : "Not linked"}
            </Badge>
          }
        />
        <DetailField label="Mobile role" value={humanizeCode(user.mobileRole)} />
        <DetailField label="Token version" value={user.tokenVersion} />
      </DetailCard>

      <DetailCard title="Account lifecycle" description="Operational state and audit timestamps for this account.">
        <DetailField label="Account status" value={<StatusBadge status={user.accountStatus} />} />
        <DetailField label="Created" value={<DateValue value={user.createdAt} />} />
        <DetailField label="Last updated" value={<DateValue value={user.updatedAt} />} />
        <DetailField label="Deleted" value={<DateValue value={user.deletedAt} />} />
        <DetailField label="Total XP" value={formatNumber(user.totalXp)} />
        <DetailField label="Level" value={user.level} />
      </DetailCard>
    </div>
  );
}

interface ActivityMetric {
  key: keyof Pick<AdminUserActivity, "posts" | "comments" | "communitiesJoined" | "eventsRsvpd" | "reportsFiled" | "reportsReceived">;
  label: string;
  description: string;
  icon: typeof Activity;
}

const ACTIVITY_METRICS: ActivityMetric[] = [
  { key: "posts", label: "Posts", description: "Published posts", icon: FileText },
  { key: "comments", label: "Comments", description: "Post and discussion comments", icon: MessageSquare },
  { key: "communitiesJoined", label: "Communities", description: "Active community memberships", icon: Users },
  { key: "eventsRsvpd", label: "Events RSVP'd", description: "Joined or attended events", icon: GraduationCap },
  { key: "reportsFiled", label: "Reports filed", description: "Reports submitted by this user", icon: Activity },
  { key: "reportsReceived", label: "Reports received", description: "Reports on this user's content", icon: Activity },
];

function ActivityTabSkeleton() {
  return (
    <div role="status" aria-label="Loading activity data" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading activity data…</span>
      {ACTIVITY_METRICS.map((metric) => (
        <div key={metric.key} className="h-28 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      ))}
    </div>
  );
}

export function UserActivityTab({ userId }: { userId: string }) {
  const activityQuery = useUserActivity(userId);

  if (activityQuery.isLoading) return <ActivityTabSkeleton />;

  if (activityQuery.isError || !activityQuery.data) {
    return (
      <ErrorState
        title="Activity unavailable"
        description="We could not load this user's activity counters right now."
        onRetry={() => void activityQuery.refetch()}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="User activity counts">
      {ACTIVITY_METRICS.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.key} data-testid={`user-activity-${metric.key}`}>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                  {formatNumber(activityQuery.data[metric.key])}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
