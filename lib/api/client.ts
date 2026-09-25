import { env } from "@/lib/config/env";

import { buildQuery } from "./endpoints";
import { ApiError } from "./errors";
import type { ApiResponse } from "./types";

/**
 * The one way the portal talks to the backend.
 *
 * <p>Unwraps the `ApiResponse` envelope, turns failures into a typed {@link ApiError} the UI
 * can branch on, and refreshes an expired session once — not once per in-flight request.
 */

/** Supplied by the auth provider (ADM-035). Kept behind an interface so `lib/api` does not
 * import the auth feature, which would make the dependency circular. */
interface AuthBridge {
  /** Current access token, held in memory — never `localStorage` (SSOT §10.9). */
  getAccessToken: () => string | null;
  /** Exchanges the refresh cookie for a new access token. `false` means the session is over. */
  refresh: () => Promise<boolean>;
  /** Called when refresh fails, so the app can send the admin back to sign-in. */
  onSessionExpired?: () => void;
}

const noAuth: AuthBridge = {
  getAccessToken: () => null,
  refresh: async () => false,
};

let auth: AuthBridge = noAuth;

/** Wired once at start-up by the auth provider. */
export function configureAuth(bridge: AuthBridge): void {
  auth = bridge;
}

/** Test seam: drops back to the unauthenticated bridge. */
export function resetAuth(): void {
  auth = noAuth;
  refreshInFlight = null;
}

/**
 * The single-flight guard.
 *
 * <p>A dashboard fires a dozen queries at once, so an expired token produces a dozen
 * simultaneous 401s. Without this, each would start its own refresh: the backend rotates the
 * refresh token on every call, so the first rotation invalidates the token the other eleven
 * are still using, and the admin is thrown out mid-session. They share one promise instead.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= auth.refresh().finally(() => {
    // Cleared so a *later* expiry can refresh again. Holding the resolved promise would
    // make every future 401 reuse a stale answer.
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON. Use `FormData` via `rawBody` if that is ever needed. */
  body?: unknown;
  query?: Record<string, unknown>;
  signal?: AbortSignal;
  /** The endpoint's response format. JSON remains the default for normal API calls. */
  accept?: string;
  /** Skips the refresh-and-retry. Used by the refresh call itself, to avoid recursion. */
  skipAuthRetry?: boolean;
}

function url(path: string, query?: Record<string, unknown>): string {
  return `${env.NEXT_PUBLIC_API_BASE_URL}${path}${buildQuery(query)}`;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const token = auth.getAccessToken();

  return fetch(url(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      Accept: options.accept ?? "application/json",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    // Sends the httpOnly refresh cookie. Same-origin under the path-based routing of
    // SSOT §1.7, so this is not a CORS credentials case.
    credentials: "include",
  });
}

/**
 * Calls the API and returns the unwrapped `data`.
 *
 * @throws {ApiError} on any non-success, including a transport failure.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await send(path, options);
  } catch (cause) {
    // An abort is the caller's own doing - let it propagate so TanStack Query can tell a
    // cancelled query from a failed one.
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError({
      status: 0,
      rawCode: "NETWORK",
      serverMessage: cause instanceof Error ? cause.message : String(cause),
    });
  }

  // One retry, and only for an expired session.
  if (response.status === 401 && !options.skipAuthRetry) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      response = await send(path, { ...options, skipAuthRetry: true });
    } else {
      auth.onSessionExpired?.();
    }
  }

  return unwrap<T>(response);
}

export interface DownloadResult {
  blob: Blob;
  filename: string;
}

/**
 * Downloads a non-JSON API response while retaining the normal auth refresh and typed API error
 * behaviour. This is intentionally separate from `request`: CSV is a file, not an ApiResponse
 * envelope, so attempting to unwrap it as JSON would turn a successful export into an error.
 */
export async function download(
  path: string,
  options: Omit<RequestOptions, "method" | "body"> = {},
): Promise<DownloadResult> {
  return downloadResponse(path, { ...options, method: "GET" });
}

/** Downloads a non-JSON response from a JSON POST endpoint, such as audited CSV exports. */
export async function downloadPost(
  path: string,
  body: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {},
): Promise<DownloadResult> {
  return downloadResponse(path, { ...options, method: "POST", body });
}

async function downloadResponse(path: string, options: RequestOptions): Promise<DownloadResult> {
  let response: Response;

  try {
    response = await send(path, options);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError({
      status: 0,
      rawCode: "NETWORK",
      serverMessage: cause instanceof Error ? cause.message : String(cause),
    });
  }

  if (response.status === 401 && !options.skipAuthRetry) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      response = await send(path, { ...options, skipAuthRetry: true });
    } else {
      auth.onSessionExpired?.();
    }
  }

  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!response.ok || contentType.includes("application/json")) {
    throw await apiErrorFromResponse(response);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromContentDisposition(response.headers.get("Content-Disposition")),
  };
}

async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  try {
    const envelope = (await response.json()) as ApiResponse<unknown>;
    return new ApiError({
      status: response.status,
      rawCode: envelope?.errorCode,
      serverMessage: envelope?.message,
    });
  } catch {
    return new ApiError({
      status: response.status,
      rawCode: response.ok ? "API_ERROR" : undefined,
      serverMessage: `Response was not JSON (HTTP ${response.status})`,
    });
  }
}

function filenameFromContentDisposition(value: string | null): string {
  const match = value?.match(/filename\*?=(?:UTF-8''|)?["']?([^;"']+)["']?/i);
  const candidate = match?.[1]?.trim() ?? "genlink-users.csv";
  const filename = candidate.split(/[\\/]/).at(-1) ?? "genlink-users.csv";
  return /^[a-zA-Z0-9._-]+$/.test(filename) ? filename : "genlink-users.csv";
}

async function unwrap<T>(response: Response): Promise<T> {
  // 204, or any empty body. Nothing to parse and nothing the caller expects.
  if (response.status === 204) return undefined as T;

  let envelope: ApiResponse<T> | undefined;
  try {
    envelope = (await response.json()) as ApiResponse<T>;
  } catch {
    // A non-JSON body means something upstream answered instead of the API — an nginx error
    // page, a proxy timeout. Reported as the HTTP status rather than a parse error, which
    // would send the reader looking in the wrong place.
    throw new ApiError({
      status: response.status,
      rawCode: response.ok ? "API_ERROR" : undefined,
      serverMessage: `Response was not JSON (HTTP ${response.status})`,
    });
  }

  // `success` is the authority, not the status code: the envelope carries the contract.
  if (!response.ok || !envelope?.success) {
    throw new ApiError({
      status: response.status,
      rawCode: envelope?.errorCode,
      serverMessage: envelope?.message,
    });
  }

  return envelope.data as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
  download: (path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    download(path, options),
  downloadPost: (
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => downloadPost(path, body, options),
};
