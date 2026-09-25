import type { AnalyticsDashboardId } from "./analytics-state";

export interface AnalyticsRangeResponse {
  from: string;
  to: string;
  granularity: string;
}

export interface AnalyticsSeriesPoint {
  bucket: string;
  count: number;
}

export interface AnalyticsUserGrowthResponse extends AnalyticsRangeResponse {
  points: AnalyticsSeriesPoint[];
}

export interface AnalyticsActiveUsersPoint {
  bucket: string;
  dau: number;
  mau: number;
}

export interface AnalyticsActiveUsersResponse extends AnalyticsRangeResponse {
  estimated: boolean;
  points: AnalyticsActiveUsersPoint[];
}

export interface AnalyticsRegistrationPoint {
  bucket: string;
  local: number;
  google: number;
  other: number;
  total: number;
}

export interface AnalyticsRegistrationsResponse extends AnalyticsRangeResponse {
  points: AnalyticsRegistrationPoint[];
}

export interface AnalyticsDistributionPoint {
  label: string;
  count: number;
}

export interface AnalyticsTrendPoint {
  bucket: string;
  label: string;
  count: number;
}

export interface AnalyticsDistributionResponse extends AnalyticsRangeResponse {
  distribution: AnalyticsDistributionPoint[];
  trend: AnalyticsTrendPoint[];
}

export interface AnalyticsLevelPoint {
  level: number;
  count: number;
}

export interface AnalyticsXpDistributionResponse extends AnalyticsRangeResponse {
  buckets: AnalyticsDistributionPoint[];
  levels: AnalyticsLevelPoint[];
}

export type AnalyticsDataById = {
  "user-growth": AnalyticsUserGrowthResponse;
  "active-users": AnalyticsActiveUsersResponse;
  registrations: AnalyticsRegistrationsResponse;
  "user-status": AnalyticsDistributionResponse;
  universities: AnalyticsDistributionResponse;
  "work-status": AnalyticsDistributionResponse;
  languages: AnalyticsDistributionResponse;
  "xp-distribution": AnalyticsXpDistributionResponse;
  platforms: AnalyticsDistributionResponse;
};

export type AnalyticsDashboardData = AnalyticsDataById[AnalyticsDashboardId];
