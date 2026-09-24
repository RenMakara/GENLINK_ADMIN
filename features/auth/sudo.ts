import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

/** A credential accepted by POST /admin/auth/sudo. Only one is sent by the UI. */
export interface SudoCredentials {
  code?: string;
  password?: string;
}

/** The backend's five-minute step-up response. */
export interface SudoResponse {
  expiresInSeconds: number;
  expiresAt: string;
}

export interface SudoWindow {
  expiresAt: string;
  expiresAtMs: number;
  expiresInSeconds: number;
}

export interface SudoWindowState {
  isOpen: boolean;
  expiresAt: string | null;
  secondsRemaining: number;
}

let windowExpiresAtMs: number | null = null;
let windowExpiresAt: string | null = null;
let windowSeconds = 0;
let openInFlight: Promise<SudoWindow> | null = null;
let generation = 0;

function now(): number {
  return Date.now();
}

function isOpenAt(timestamp: number): boolean {
  return windowExpiresAtMs !== null && windowExpiresAtMs > timestamp;
}

function toSudoWindow(response: SudoResponse | undefined): SudoWindow {
  if (
    !response ||
    !Number.isFinite(response.expiresInSeconds) ||
    response.expiresInSeconds <= 0 ||
    typeof response.expiresAt !== "string"
  ) {
    throw new Error("The sudo window response was incomplete");
  }

  const expiresAtMs = Date.parse(response.expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now()) {
    throw new Error("The sudo window response had an invalid expiry");
  }

  return {
    expiresAt: response.expiresAt,
    expiresAtMs,
    expiresInSeconds: response.expiresInSeconds,
  };
}

function rememberWindow(window: SudoWindow, expectedGeneration: number): SudoWindow {
  // A logout or token refresh may have happened while the request was in flight. In that case
  // the response belongs to the old session and must not arm the new one in this tab.
  if (expectedGeneration === generation) {
    windowExpiresAtMs = window.expiresAtMs;
    windowExpiresAt = window.expiresAt;
    windowSeconds = window.expiresInSeconds;
  }
  return window;
}

/**
 * Opens the server-side five-minute window, or reuses the still-open window in this tab.
 *
 * <p>The cache is deliberately memory-only: a sudo window must not survive a reload, logout,
 * or a new session. The single-flight guard also prevents two high-tier dialogs opened at once
 * from sending two re-authentication requests with the same one-time TOTP code.
 */
export function openSudoWindow(credentials: SudoCredentials): Promise<SudoWindow> {
  if (isOpenAt(now())) {
    return Promise.resolve({
      expiresAt: windowExpiresAt as string,
      expiresAtMs: windowExpiresAtMs as number,
      expiresInSeconds: windowSeconds,
    });
  }

  if (openInFlight) {
    return openInFlight;
  }

  const expectedGeneration = generation;
  const request = api
    .post<SudoResponse>(endpoints.auth.sudo, credentials)
    .then((response) => rememberWindow(toSudoWindow(response), expectedGeneration));
  openInFlight = request;
  // A request from before clearSudoWindow() may settle after a newer request has started. Only
  // the currently registered request is allowed to clear the single-flight slot.
  void request.then(
    () => {
      if (openInFlight === request) openInFlight = null;
    },
    () => {
      if (openInFlight === request) openInFlight = null;
    },
  );

  return request;
}

/** Returns the client-side view of the current window without exposing credentials or tokens. */
export function getSudoWindowState(timestamp = now()): SudoWindowState {
  if (!isOpenAt(timestamp)) {
    return { isOpen: false, expiresAt: null, secondsRemaining: 0 };
  }

  return {
    isOpen: true,
    expiresAt: windowExpiresAt,
    secondsRemaining: Math.max(0, Math.ceil(((windowExpiresAtMs as number) - timestamp) / 1000)),
  };
}

/**
 * Clears local knowledge of the window. The server remains authoritative and can still reject a
 * request with ADMIN_SUDO_REQUIRED; callers should clear this cache when that happens too.
 */
export function clearSudoWindow(): void {
  generation += 1;
  windowExpiresAtMs = null;
  windowExpiresAt = null;
  windowSeconds = 0;
  // Do not let a late response from a previous session populate the cache. The promise itself
  // cannot be cancelled portably, but its generation check makes the result harmless.
  openInFlight = null;
}
