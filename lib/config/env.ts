import { z } from "zod";

/** Central validated environment config; app code should not read `process.env` directly. */

/** Use literal env properties so Next.js can inline public values at build time. */
const raw = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
  ADMIN_COOKIE_SECURE: process.env.ADMIN_COOKIE_SECURE,
  ADMIN_API_ORIGIN: process.env.ADMIN_API_ORIGIN,
} as const;

/** Accepts the spellings a shell or CI actually produces, and nothing else. */
const booleanish = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

/** Browser-visible settings only; never expose secrets here. */
const clientSchema = z.object({
  /** API base path; use an absolute URL only for a separate API host. */
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), {
      message:
        "must be a relative path starting with '/' or an absolute http(s) URL, " +
        "e.g. '/api/v1' or 'https://api.genlink.kh/api/v1'",
    })
    .default("/api/v1"),

  /** Portal base path, without a trailing slash. */
  NEXT_PUBLIC_BASE_PATH: z
    .string()
    .refine((value) => value === "" || (value.startsWith("/") && !value.endsWith("/")), {
      message: "must be empty or start with '/' and not end with one, e.g. '/admin'",
    })
    .default("/admin"),

  /** Timezone used for displayed dates. */
  NEXT_PUBLIC_TIMEZONE: z
    .string()
    .refine((value) => Intl.supportedValuesOf("timeZone").includes(value), {
      message: "must be an IANA timezone name, e.g. 'Asia/Phnom_Penh'",
    })
    .default("Asia/Phnom_Penh"),

  /** Deployment name used by the environment badge. */
  NEXT_PUBLIC_ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),

  /** Enables browser API mocks during development. */
  NEXT_PUBLIC_API_MOCKING: booleanish.default(false),
});

/**
 * Server-only configuration. Never sent to the browser.
 */
const serverSchema = z.object({
  /** Secure flag for the refresh cookie; defaults to true. */
  ADMIN_COOKIE_SECURE: booleanish.default(true),

  /** Server-only origin for route-handler calls to Spring. */
  ADMIN_API_ORIGIN: z
    .string()
    .refine((value) => /^https?:\/\//.test(value), {
      message: "must be an absolute http(s) origin, e.g. 'http://localhost:8888'",
    })
    .default("http://localhost:8888"),
});

function parse<T extends z.ZodType>(schema: T, label: string): z.infer<T> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  // Thrown at import time, so a bad value stops the build or the server start rather than
  // surfacing later as a puzzling runtime failure. The message names the variables so it is
  // actionable without reading this file.
  throw new Error(
    `Invalid ${label} environment configuration:\n${details}\n\n` +
      "See .env.example for the expected values.",
  );
}

/** Client-safe configuration. Importable from anywhere. */
export const env = parse(clientSchema, "client");

/**
 * Server-only configuration.
 *
 * <p>A function rather than a constant so importing this module from a client component does
 * not evaluate it. The variables are not `NEXT_PUBLIC_*`, so in the browser they would parse
 * as absent and silently take their defaults — quietly reporting `ADMIN_COOKIE_SECURE: true`
 * on a page that has no idea.
 */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error(
      "serverEnv() was called in the browser. These variables are not exposed to the " +
        "client; read them in a Server Component, a route handler, or proxy.ts.",
    );
  }
  return parse(serverSchema, "server");
}

export type Env = typeof env;

/**
 * Build mode, not configuration — which is why it is exposed here rather than read directly.
 *
 * <p>`NODE_ENV` is set by the toolchain, not by an operator, so it is not part of the schema
 * above. It still has to come through this module: the lint rule that keeps `process.env` in
 * one place makes no exception for it, and shouldn't — an exception is how the next one gets
 * added.
 *
 * <p>Next replaces `process.env.NODE_ENV` with a literal at build time, so a `false` here is
 * statically known and the guarded code is dropped from the production bundle entirely.
 */
export const isDevelopment = process.env.NODE_ENV === "development";
