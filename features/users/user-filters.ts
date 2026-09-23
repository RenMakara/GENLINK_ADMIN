import type { TableFilterCodec, TableFilterCodecs } from "@/hooks/use-table-state";
import { tableFilterCodecs } from "@/hooks/use-table-state";
import { USER_STATUSES, type UserStatus } from "@/lib/ui/status";

import {
  USER_WORK_STATUSES,
  type UserWorkStatus,
} from "./types";

export const USER_GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;
export type UserGender = (typeof USER_GENDERS)[number];

export const USER_LANGUAGES = ["ENGLISH", "KHMER"] as const;
export type UserLanguage = (typeof USER_LANGUAGES)[number];

export const USER_AUTH_PROVIDERS = ["LOCAL", "GOOGLE"] as const;
export type UserAuthProvider = (typeof USER_AUTH_PROVIDERS)[number];

export const USER_EMAIL_VERIFICATION_STATES = ["ANY", "VERIFIED", "UNVERIFIED"] as const;
export type UserEmailVerificationState = (typeof USER_EMAIL_VERIFICATION_STATES)[number];

export const USER_LAST_ACTIVE_PRESETS = ["", "24h", "7d", "30d", "90d+", "never"] as const;
export type UserLastActivePreset = (typeof USER_LAST_ACTIVE_PRESETS)[number];

/** All thirteen SSOT §4.3 filters. Their keys intentionally match the API query parameters. */
export interface UserFilters {
  status: UserStatus[];
  emailVerified: UserEmailVerificationState;
  workStatus: UserWorkStatus[];
  university: string;
  gender: UserGender[];
  language: UserLanguage[];
  authProvider: UserAuthProvider[];
  levelMin: number | null;
  levelMax: number | null;
  xpMin: number | null;
  xpMax: number | null;
  createdFrom: string;
  createdTo: string;
  lastActive: UserLastActivePreset;
  banned: boolean;
  includeDeleted: boolean;
}

/** Presentation defaults for the two range controls, not backend validation limits. */
export interface UserRangeBounds {
  min: number;
  max: number;
  step: number;
}

export const DEFAULT_USER_LEVEL_BOUNDS: UserRangeBounds = { min: 1, max: 100, step: 1 };
export const DEFAULT_USER_XP_BOUNDS: UserRangeBounds = { min: 0, max: 100_000, step: 1 };

export function createDefaultUserFilters(): UserFilters {
  return {
    status: [],
    emailVerified: "ANY",
    workStatus: [],
    university: "",
    gender: [],
    language: [],
    authProvider: [],
    levelMin: null,
    levelMax: null,
    xpMin: null,
    xpMax: null,
    createdFrom: "",
    createdTo: "",
    lastActive: "",
    banned: false,
    includeDeleted: false,
  };
}

function enumArrayCodec<const TValue extends string>(
  allowedValues: readonly TValue[],
): TableFilterCodec<TValue[]> {
  const allowed = new Set(allowedValues);

  return {
    defaultValue: [],
    parse: (values) => {
      const parsed = Array.from(
        new Set(
          values
            .flatMap((value) => value.split(","))
            .filter((value): value is TValue => allowed.has(value as TValue)),
        ),
      );
      return parsed;
    },
    // The SSOT shows comma-separated enum filters. Parsing also accepts repeated keys so links
    // produced by earlier generic table consumers remain readable and are canonicalised on edit.
    serialize: (value) => {
      const valid = Array.from(new Set(value.filter((item) => allowed.has(item))));
      return valid.length > 0 ? [valid.join(",")] : [];
    },
  };
}

function optionalIntegerCodec(): TableFilterCodec<number | null> {
  return {
    defaultValue: null,
    parse: (values) => {
      const value = values.at(-1);
      if (!value) return null;
      if (!/^\d+$/.test(value)) return undefined;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
    },
    serialize: (value) => (value === null ? [] : [String(value)]),
  };
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function calendarDateCodec(): TableFilterCodec<string> {
  return {
    defaultValue: "",
    parse: (values) => {
      const value = values.at(-1) ?? "";
      return value === "" || isCalendarDate(value) ? value : undefined;
    },
    serialize: (value) => (isCalendarDate(value) ? [value] : []),
  };
}

function emailVerificationCodec(): TableFilterCodec<UserEmailVerificationState> {
  return {
    defaultValue: "ANY",
    parse: (values) => {
      const value = values.at(-1);
      if (value === "true") return "VERIFIED";
      if (value === "false") return "UNVERIFIED";
      return undefined;
    },
    serialize: (value) => {
      if (value === "VERIFIED") return ["true"];
      if (value === "UNVERIFIED") return ["false"];
      return [];
    },
  };
}

export const USER_FILTER_CODECS: TableFilterCodecs<UserFilters> = {
  status: enumArrayCodec(USER_STATUSES),
  emailVerified: emailVerificationCodec(),
  workStatus: enumArrayCodec(USER_WORK_STATUSES),
  university: tableFilterCodecs.string(),
  gender: enumArrayCodec(USER_GENDERS),
  language: enumArrayCodec(USER_LANGUAGES),
  authProvider: enumArrayCodec(USER_AUTH_PROVIDERS),
  levelMin: optionalIntegerCodec(),
  levelMax: optionalIntegerCodec(),
  xpMin: optionalIntegerCodec(),
  xpMax: optionalIntegerCodec(),
  createdFrom: calendarDateCodec(),
  createdTo: calendarDateCodec(),
  lastActive: tableFilterCodecs.enum(USER_LAST_ACTIVE_PRESETS, ""),
  banned: tableFilterCodecs.boolean(),
  includeDeleted: tableFilterCodecs.boolean(),
};

export const USER_FILTER_OPTIONS = {
  status: [
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING", label: "Pending" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "BANNED", label: "Banned" },
    { value: "DELETED", label: "Deleted" },
  ] satisfies ReadonlyArray<{ value: UserStatus; label: string }>,
  workStatus: [
    { value: "STUDENT", label: "Student" },
    { value: "FRESH_GRADUATE", label: "Fresh graduate" },
    { value: "YOUNG_PROFESSIONAL", label: "Young professional" },
    { value: "CREATOR", label: "Creator" },
    { value: "FREELANCER", label: "Freelancer" },
    { value: "ENTREPRENEUR", label: "Entrepreneur" },
    { value: "OTHER", label: "Other" },
  ] satisfies ReadonlyArray<{ value: UserWorkStatus; label: string }>,
  gender: [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ] satisfies ReadonlyArray<{ value: UserGender; label: string }>,
  language: [
    { value: "ENGLISH", label: "English" },
    { value: "KHMER", label: "Khmer" },
  ] satisfies ReadonlyArray<{ value: UserLanguage; label: string }>,
  authProvider: [
    { value: "LOCAL", label: "Email/password" },
    { value: "GOOGLE", label: "Google" },
  ] satisfies ReadonlyArray<{ value: UserAuthProvider; label: string }>,
} as const;

export const USER_LAST_ACTIVE_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d+", label: "Over 90 days" },
  { value: "never", label: "Never active" },
] satisfies ReadonlyArray<{ value: UserLastActivePreset; label: string }>;

export function labelForFilterValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

