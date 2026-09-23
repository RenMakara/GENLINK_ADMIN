"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  HelpCircle,
  Mail,
  MinusCircle,
  Server,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatRelative } from "@/lib/utils/date";

export type SubsystemStatus = "UP" | "DOWN" | "DEGRADED" | "DISABLED" | "UNKNOWN";
export type JobOutcome = "SUCCESS" | "FAILURE" | "NEVER_RUN";

export interface ComponentHealthItem {
  status: SubsystemStatus;
}

export type MailOutcome = "SUCCESS" | "FAILURE" | "NEVER_RUN";

export interface MailHealthItem extends ComponentHealthItem {
  enabled: boolean;
  lastOutcome: MailOutcome;
}

export interface JobHealthItem {
  name: string;
  lastRun: string | null;
  lastOutcome: JobOutcome;
}

export interface SystemHealthData {
  status?: SubsystemStatus;
  api?: ComponentHealthItem;
  database?: ComponentHealthItem;
  storage?: ComponentHealthItem;
  mail?: MailHealthItem;
  checkedAt?: string;
  uptimeSeconds?: number;
  scheduledJobs?: JobHealthItem[];
}

export interface SystemHealthPanelProps {
  /** Health check payload */
  data?: SystemHealthData | null;
  /** True while payload is loading */
  loading?: boolean;
  /** Optional error message */
  error?: string | null;
  /** Container CSS class name */
  className?: string;
}

/** Configuration for rendering subsystem status with text label AND icon (AC#1). */
interface StatusUI {
  label: string;
  icon: ComponentType<LucideProps>;
  colorClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

function getStatusUI(status: SubsystemStatus | undefined): StatusUI {
  switch (status) {
    case "UP":
      return {
        label: "Healthy",
        icon: CheckCircle2,
        colorClass: "text-success",
        badgeVariant: "default",
      };
    case "DEGRADED":
      return {
        label: "Degraded",
        icon: AlertTriangle,
        colorClass: "text-warning",
        badgeVariant: "outline",
      };
    case "DOWN":
      return {
        label: "Unhealthy",
        icon: XCircle,
        colorClass: "text-destructive",
        badgeVariant: "destructive",
      };
    case "DISABLED":
      return {
        label: "Disabled",
        icon: MinusCircle,
        colorClass: "text-muted-foreground",
        badgeVariant: "secondary",
      };
    default:
      return {
        label: "Unknown",
        icon: HelpCircle,
        colorClass: "text-muted-foreground",
        badgeVariant: "outline",
      };
  }
}

function getJobOutcomeUI(outcome: JobOutcome | undefined): StatusUI {
  switch (outcome) {
    case "SUCCESS":
      return {
        label: "Success",
        icon: CheckCircle2,
        colorClass: "text-success",
        badgeVariant: "default",
      };
    case "FAILURE":
      return {
        label: "Failed",
        icon: AlertCircle,
        colorClass: "text-destructive",
        badgeVariant: "destructive",
      };
    case "NEVER_RUN":
    default:
      return {
        label: "Never run since restart",
        icon: Clock,
        colorClass: "text-muted-foreground",
        badgeVariant: "secondary",
      };
  }
}

const JOB_DISPLAY_NAMES: Record<string, string> = {
  AccountAnonymizationJob: "Account Anonymization Job",
  RecurringFinanceJob: "Recurring Finance Job",
  MediaCleanupJob: "Media Cleanup Job",
};

function getJobDisplayName(name: string): string {
  return JOB_DISPLAY_NAMES[name] ?? name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function getMailDetails(mail: MailHealthItem | undefined): string {
  if (!mail) return "Status unavailable";
  if (!mail.enabled) return "Disabled by configuration";

  switch (mail.lastOutcome) {
    case "SUCCESS":
      return "Last delivery succeeded";
    case "FAILURE":
      return "Last delivery failed";
    case "NEVER_RUN":
      return "No delivery since restart";
  }
}

function needsAttention(status: SubsystemStatus): boolean {
  return status === "DOWN" || status === "DEGRADED" || status === "UNKNOWN";
}

/**
 * System Health Summary Panel (SSOT §2.5, ADM-055).
 *
 * <p>Surfaces backend Actuator status, S3 storage, mail delivery, and scheduled job outcomes.
 * Every indicator features accessible status icons AND text labels (never color alone - AC#1).
 * Scheduled jobs distinguish "Never run since restart" from "Failed" (AC#2).
 */
export function SystemHealthPanel({
  data,
  loading = false,
  error,
  className,
}: SystemHealthPanelProps) {
  if (loading) {
    return (
      <Card className={`w-full ${className ?? ""}`}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">System Health Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="animate-pulse bg-muted h-20 rounded-lg border border-border/50" />
            ))}
          </div>
          <div className="animate-pulse bg-muted h-24 rounded-lg border border-border/50" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className ?? ""}`}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">System Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertTitle>Health Check Unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const apiStatus = data?.api?.status ?? "UNKNOWN";
  const dbStatus = data?.database?.status ?? "UNKNOWN";
  const storageStatus = data?.storage?.status ?? "UNKNOWN";
  const mailStatus: SubsystemStatus = !data?.mail
    ? "UNKNOWN"
    : data.mail.enabled
      ? data.mail.status
      : "DISABLED";
  const jobs = data?.scheduledJobs ?? [];

  const hasDegradedSubsystem =
    data?.status === "DOWN" ||
    data?.status === "DEGRADED" ||
    needsAttention(apiStatus) ||
    needsAttention(dbStatus) ||
    needsAttention(storageStatus) ||
    needsAttention(mailStatus) ||
    jobs.some((job) => job.lastOutcome === "FAILURE");

  const indicators = [
    {
      id: "api",
      label: "API Uptime",
      details: "Spring Boot API",
      status: apiStatus,
      icon: Server,
    },
    {
      id: "db",
      label: "Database",
      details: "PostgreSQL",
      status: dbStatus,
      icon: Database,
    },
    {
      id: "storage",
      label: "Object Storage (S3)",
      details: "S3 object storage",
      status: storageStatus,
      icon: HardDrive,
    },
    {
      id: "mail",
      label: "Mail Delivery",
      details: getMailDetails(data?.mail),
      status: mailStatus,
      icon: Mail,
    },
  ];

  return (
    <Card className={`w-full ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">System Health Summary</CardTitle>
          <p className="text-xs text-muted-foreground">Actuator & infrastructure status (SSOT §2.5)</p>
          {data?.checkedAt ? (
            <p className="text-[11px] text-muted-foreground mt-1">
              Checked {formatDateTime(data.checkedAt)}
            </p>
          ) : null}
        </div>
        <Server className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {hasDegradedSubsystem ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>System Alert</AlertTitle>
            <AlertDescription>
              One or more core subsystems are degraded or unresponsive. Review infrastructure logs.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* 4 Infrastructure Subsystems */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {indicators.map((item) => {
            const ui = getStatusUI(item.status);
            const StatusIcon = ui.icon;
            const ItemIcon = item.icon;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ItemIcon className="size-4 text-muted-foreground shrink-0" aria-hidden />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {item.label}
                    </span>
                  </div>
                  <StatusIcon className={`size-4 shrink-0 ${ui.colorClass}`} aria-hidden />
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <Badge variant={ui.badgeVariant} className="text-[10px] px-1.5 py-0">
                    {ui.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground truncate">{item.details}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scheduled Jobs Section */}
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Scheduled Jobs (Last Run Outcomes)
            </h4>
          </div>

          <div className="divide-y divide-border/50 text-sm">
            {jobs.length === 0 ? (
              <p className="py-2.5 text-xs text-muted-foreground" role="status">
                No scheduled job status is available.
              </p>
            ) : null}
            {jobs.map((job) => {
              const outcomeUI = getJobOutcomeUI(job.lastOutcome);
              const OutcomeIcon = outcomeUI.icon;

              const isNeverRun = job.lastOutcome === "NEVER_RUN" || !job.lastRun;
              const relTime = isNeverRun
                ? "Never run since restart"
                : formatRelative(job.lastRun);
              const fullTime = isNeverRun
                ? "Job has not executed since application restart"
                : formatDateTime(job.lastRun);

              return (
                <div key={job.name} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <OutcomeIcon className={`size-4 shrink-0 ${outcomeUI.colorClass}`} aria-hidden />
                    <span className="font-medium text-foreground text-xs truncate">
                      {getJobDisplayName(job.name)}
                    </span>
                    <Badge variant={outcomeUI.badgeVariant} className="text-[10px] px-1.5 py-0 font-normal">
                      {outcomeUI.label}
                    </Badge>
                  </div>

                  <time
                    dateTime={job.lastRun ?? undefined}
                    title={fullTime}
                    className="text-xs text-muted-foreground shrink-0 cursor-help underline decoration-dotted underline-offset-2"
                  >
                    {relTime}
                  </time>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
