import { z } from "zod";

/**
 * The only file in the application that reads `process.env`.
 *
 * <p>SSOT §1.7 requires the portal to be domain-agnostic: no hostname, IP, port or scheme in
 * code, so moving from `http://<ip>/admin` to `https://admin.genlink.kh` is a configuration
 * change and nothing more. That only holds if configuration enters through one door, which is
 * why an ESLint rule forbids `process.env` everywhere else.
 *
 * <p>Values are validated rather than merely read. An unvalidated env var does not fail — it
 * arrives as `undefined` and the app cheerfully requests `undefined/admin/users`, which
 * surfaces as a confusing 404 rather than a configuration error.
 */

/**
 * Every variable is accessed as a literal property.
 *
 * <p>Next.js substitutes `process.env.NEXT_PUBLIC_*` at build time by textual replacement, so
 * a dynamic lookup — `process.env[name]` — is never replaced and reads `undefined` in the
 * browser. This object cannot be built in a loop for that reason.
 */
const raw = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  ADMIN_COOKIE_SECURE: process.env.ADMIN_COOKIE_SECURE,
} as const;

/** Accepts the spellings a shell or CI actually produces, and nothing else. */
const booleanish = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

/**
 * Client-readable configuration. `NEXT_PUBLIC_*` is inlined into the browser bundle, so
 * nothing secret may go here — the prefix is a publication decision, not a naming convention.
 */
const clientSchema = z.object({
  /**
   * Where the admin API lives. Relative by default: under the path-based routing chosen in
   * SSOT §1.7 the portal and the API share one origin, which removes CORS from the MVP
   * entirely. An absolute URL here is what the eventual subdomain split will set.
   */
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), {
      message:
        "must be a relative path starting with '/' or an absolute http(s) URL, " +
        "e.g. '/api/v1' or 'https://api.genlink.kh/api/v1'",
    })
    .default("/api/v1"),

  /**
   * Path the portal is served under. `/admin` today; empty once it has its own subdomain.
   * Must not end in a slash — Next.js rejects that, and it is easy to add by habit.
   */
  NEXT_PUBLIC_BASE_PATH: z
    .string()
    .refine((value) => value === "" || (value.startsWith("/") && !value.endsWith("/")), {
      message: "must be empty or start with '/' and not end with one, e.g. '/admin'",
    })
    .default("/admin"),

  /**
   * Display timezone. Fixed rather than the browser's, so an admin travelling sees the same
   * day boundaries as a colleague in Phnom Penh (SSOT §9.5).
   */
  NEXT_PUBLIC_TIMEZONE: z
    .string()
    .refine((value) => Intl.supportedValuesOf("timeZone").includes(value), {
      message: "must be an IANA timezone name, e.g. 'Asia/Phnom_Penh'",
    })
    .default("Asia/Phnom_Penh"),

  /**
   * Which deployment this is. Drives the topbar badge (SSOT §3).
   *
   * <p>Not cosmetic. Staff will have staging and production open in adjacent tabs, and "ban
   * user" is not an action you want to take against the wrong database. The badge is the only
   * thing on screen that tells them apart.
   *
   * <p>Defaults to `development`, so a misconfigured deployment shows a badge it should not
   * rather than hiding one it should show. Failing towards a visible warning is the right
   * direction for a control whose whole job is to be noticed.
   */
  NEXT_PUBLIC_ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),
});

/**
 * Server-only configuration. Never sent to the browser.
 */
const serverSchema = z.object({
  /**
   * `Secure` flag on the refresh-token cookie.
   *
   * <p>Defaults to **true**, per SSOT §10.9, and the HTTP MVP sets it to `false` explicitly.
   * That direction matters: defaulting to `false` and forgetting to set it in a TLS
   * environment ships insecure cookies silently, whereas defaulting to `true` and forgetting
   * it on plain HTTP breaks sign-in loudly on the first attempt. Fail visibly, not quietly.
   */
  ADMIN_COOKIE_SECURE: booleanish.default(true),
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
