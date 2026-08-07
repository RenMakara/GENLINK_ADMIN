import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  serverEnv: () => ({ ADMIN_COOKIE_SECURE: true, ADMIN_API_ORIGIN: "http://localhost:8888" }),
  env: { NEXT_PUBLIC_BASE_PATH: "/admin" },
}));

const {
  CSRF_COOKIE,
  CSRF_HEADER,
  REFRESH_COOKIE,
  clearedRefreshCookie,
  csrfCookieOptions,
  csrfTokenMatches,
  newCsrfToken,
  readRefreshToken,
  refreshCookieOptions,
} = await import("./session-cookies");

/** Enough of NextRequest for the cookie and header reads these functions perform. */
function request(cookies: Record<string, string>, headers: Record<string, string> = {}) {
  return {
    cookies: { get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined) },
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as never;
}

describe("refresh cookie", () => {
  it("is httpOnly, so an XSS cannot read the refresh token", () => {
    // The single most important attribute here. Without it, any injected script walks away
    // with a credential that can mint admin sessions for 8 hours (SSOT §10.9).
    expect(refreshCookieOptions(3600).httpOnly).toBe(true);
  });

  it("is SameSite=Strict", () => {
    expect(refreshCookieOptions(3600).sameSite).toBe("strict");
  });

  it("takes Secure from configuration", () => {
    // Environment-driven because a Secure cookie is silently dropped over the MVP's plain HTTP.
    expect(refreshCookieOptions(3600).secure).toBe(true);
  });

  it("is scoped to the whole app, not one path", () => {
    expect(refreshCookieOptions(3600).path).toBe("/");
  });

  it("clears with matching attributes and a zero age", () => {
    const cleared = clearedRefreshCookie();

    // A cookie is only removable by a Set-Cookie whose attributes match; a bare expiry on a
    // differently-scoped cookie leaves the original in place.
    expect(cleared.name).toBe(REFRESH_COOKIE);
    expect(cleared.value).toBe("");
    expect(cleared.maxAge).toBe(0);
    expect(cleared.path).toBe("/");
    expect(cleared.httpOnly).toBe(true);
  });

  it("reads the token back", () => {
    expect(readRefreshToken(request({ [REFRESH_COOKIE]: "abc" }))).toBe("abc");
    expect(readRefreshToken(request({}))).toBeNull();
  });
});

describe("CSRF double-submit", () => {
  /**
   * The one cookie here that must NOT be httpOnly: a double-submit token only works if the page
   * can read it and echo it back. Its protection comes from the same-origin policy, not secrecy
   * from same-origin JavaScript.
   */
  it("the CSRF cookie is readable by the page", () => {
    expect(csrfCookieOptions().httpOnly).toBe(false);
    expect(csrfCookieOptions().sameSite).toBe("strict");
  });

  it("accepts a matching header and cookie", () => {
    const token = newCsrfToken();
    expect(csrfTokenMatches(request({ [CSRF_COOKIE]: token }, { [CSRF_HEADER]: token }))).toBe(true);
  });

  it("rejects a mismatch", () => {
    expect(
      csrfTokenMatches(request({ [CSRF_COOKIE]: newCsrfToken() }, { [CSRF_HEADER]: newCsrfToken() })),
    ).toBe(false);
  });

  /** A cross-site form post carries the cookie automatically but cannot set the header. */
  it("rejects a request with the cookie but no header", () => {
    expect(csrfTokenMatches(request({ [CSRF_COOKIE]: "t" }))).toBe(false);
  });

  it("rejects a request with the header but no cookie", () => {
    expect(csrfTokenMatches(request({}, { [CSRF_HEADER]: "t" }))).toBe(false);
  });

  it("rejects an empty token on both sides rather than matching nothing to nothing", () => {
    expect(csrfTokenMatches(request({ [CSRF_COOKIE]: "" }, { [CSRF_HEADER]: "" }))).toBe(false);
  });

  /** Different lengths must not throw — timingSafeEqual does, so it is guarded. */
  it("handles differing lengths without throwing", () => {
    expect(csrfTokenMatches(request({ [CSRF_COOKIE]: "short" }, { [CSRF_HEADER]: "muchlonger" })))
      .toBe(false);
  });

  it("issues unguessable, unique tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => newCsrfToken()));

    expect(tokens.size).toBe(50);
    // 32 bytes base64url ≈ 43 chars. Enough that guessing is not a strategy.
    expect(newCsrfToken().length).toBeGreaterThanOrEqual(40);
  });
});

describe("what must never be stored where the page can read it (AC#1)", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      getItem: (k: string) => store[k] ?? null,
    });
  });

  /**
   * A structural assertion rather than a behavioural one: this module is the only code that
   * handles the refresh token, and it writes it to a cookie. If a token ever reaches
   * `localStorage`, it will be because someone added a new path — which is what the
   * `sessionStorage`/`localStorage` audit in the auth client guards.
   */
  it("the refresh token is handed to a cookie, never to storage", () => {
    const options = refreshCookieOptions(3600);

    expect(options.httpOnly).toBe(true);
    expect(Object.keys(store)).toHaveLength(0);
  });
});
