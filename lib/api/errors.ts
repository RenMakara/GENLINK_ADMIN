/**
 * The error contract (SSOT §8 C-2).
 *
 * <p>The frontend maps `errorCode`; it never parses `message`. A message can be reworded at
 * any time without notice — a code cannot, which is what makes it something the UI may branch
 * on.
 */

/**
 * Every code the admin API can return.
 *
 * <p>A union rather than a string, so `if (error.code === "ADMIN_SUDO_REQURED")` fails to
 * compile instead of silently never matching — which would show the generic fallback message
 * and lose the sudo prompt.
 */
export const ERROR_CODES = [
  // Shared, from GlobalExceptionHandler.
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "INTERNAL_SERVER_ERROR",
  "API_ERROR",
  "AUTH_INVALID_CREDENTIALS",

  // Admin authentication and authorisation.
  "ADMIN_MFA_REQUIRED",
  "ADMIN_MFA_INVALID",
  "ADMIN_MFA_NOT_ENROLLED",
  "ADMIN_SUDO_REQUIRED",
  "ADMIN_TOKEN_TYPE_INVALID",

  // RBAC guards.
  "ADMIN_SELF_MODIFICATION",
  "ADMIN_LAST_SUPER_ADMIN",

  // User administration.
  "USER_ALREADY_BANNED",
  "USER_NOT_BANNED",
  "USER_ANONYMISED",

  // Bulk and export limits.
  "EXPORT_TOO_LARGE",
  "BULK_LIMIT_EXCEEDED",

  "RATE_LIMITED",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const KNOWN = new Set<string>(ERROR_CODES);

export function isKnownErrorCode(code: string | undefined): code is ErrorCode {
  return code !== undefined && KNOWN.has(code);
}

/**
 * A failed API call.
 *
 * <p>Carries the code the UI branches on, the HTTP status, and the server's message — the
 * last for logs and bug reports only, never for display.
 */
export class ApiError extends Error {
  readonly code: ErrorCode | "UNKNOWN";
  readonly status: number;
  /** The raw `errorCode`, kept even when unrecognised so a report can name it. */
  readonly rawCode: string | undefined;
  /** The server's `message`. Diagnostic only. */
  readonly serverMessage: string | undefined;

  constructor(params: {
    status: number;
    rawCode?: string;
    serverMessage?: string;
  }) {
    // The Error message is for stack traces and logs; the UI resolves a translation instead.
    super(
      `API ${params.status} ${params.rawCode ?? "UNKNOWN"}: ${params.serverMessage ?? "no message"}`,
    );
    this.name = "ApiError";
    this.status = params.status;
    this.rawCode = params.rawCode;
    this.serverMessage = params.serverMessage;
    this.code = isKnownErrorCode(params.rawCode) ? params.rawCode : "UNKNOWN";
  }

  /** True when the caller needs to re-authenticate rather than retry. */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** True when a step-up re-auth would let this action through (SSOT §10.7). */
  get needsSudo(): boolean {
    return this.code === "ADMIN_SUDO_REQUIRED";
  }
}

/**
 * Maps a code to an i18n message key, not to English text.
 *
 * <p>Returning a key keeps this module free of user-facing copy, so it can run in a route
 * handler or `proxy.ts` where no React context exists, and so the strings are translatable
 * (ADM-012). Callers resolve it with `useTranslations("Errors")`.
 *
 * <p>An unrecognised code falls back to a generic key rather than showing the raw code to a
 * member of staff. The code still reaches the logs via {@link ApiError.rawCode}.
 */
export function errorMessageKey(error: ApiError): string {
  return error.code === "UNKNOWN" ? "UNKNOWN" : error.code;
}
