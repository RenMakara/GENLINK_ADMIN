/**
 * Which routes need a session, and where to send someone who does not have one (ADM-039).
 *
 * <p>Shared by `proxy.ts` on the server and `AuthGuard` on the client so the two cannot disagree
 * about what is protected — a proxy that guards `/users` while the client guard does not is a
 * flash of shell, and the reverse is a redirect loop.
 *
 * <p>Deliberately free of React and of `next/server`, so it is importable from both and testable
 * in a plain node environment.
 */

/** Where an admin lands when there is nothing better. First item in the sidebar. */
export const DEFAULT_ROUTE = "/dashboard";

export const LOGIN_ROUTE = "/login";

/** Query parameter carrying the page the visitor was trying to reach. */
export const RETURN_TO_PARAM = "next";

/**
 * The only paths reachable without a session.
 *
 * <h2>An allowlist, so protection is the default</h2>
 *
 * The obvious alternative — list the dashboard routes and guard those — is wrong in a way that
 * does not show up until later: Phase 3 adds `/finance`, nobody updates the list, and the page
 * ships unguarded while looking exactly like every other page. Inverting it means a new route is
 * protected the moment it exists, and the mistake in the other direction (a public page
 * accidentally guarded) is loud and immediate.
 */
const PUBLIC_ROUTES = ["/", "/login", "/mfa", "/enrol"] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isProtectedRoute(pathname: string): boolean {
  return !isPublicRoute(pathname);
}

/** C0 controls and DEL, which can split a header or truncate a comparison. */
function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
}

/**
 * Rejects anything that is not a plain path on this site.
 *
 * <h2>This is the open-redirect check</h2>
 *
 * `?next=` is attacker-controlled by definition — it arrives in a URL anyone can send. Without
 * this, `/login?next=https://evil.example/login` produces a *genuine* GenLink sign-in page that
 * hands the admin to a copy of itself the moment they authenticate. Phishing does not get more
 * convenient than a real login page redirecting to a fake one.
 *
 * <p>The cases that get missed, all of which a bare `startsWith("/")` lets through:
 *
 * <ul>
 *   <li>`//evil.example` — protocol-relative, and browsers treat it as absolute.</li>
 *   <li>`/\evil.example` — a backslash, which browsers normalise to a slash, turning it back
 *       into the case above.</li>
 *   <li>`/login` itself — not an attack, but it bounces the admin to the page they just left.</li>
 * </ul>
 *
 * @returns the path when it is safe to navigate to, otherwise {@link DEFAULT_ROUTE}
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_ROUTE;
  }
  // Checked on the raw string rather than after parsing, because the parse is what the browser
  // would do later, and it does it differently.
  if (value.startsWith("//") || value.startsWith("/\\") || hasControlCharacter(value)) {
    return DEFAULT_ROUTE;
  }

  // Resolved against a base that exists nowhere: anything escaping it — a scheme, an authority,
  // a `..` climbing out — lands on another origin and is refused.
  let resolved: URL;
  try {
    resolved = new URL(value, "https://admin.invalid");
  } catch {
    return DEFAULT_ROUTE;
  }
  if (resolved.origin !== "https://admin.invalid") {
    return DEFAULT_ROUTE;
  }

  // Sending them back to sign-in after signing in is a loop, not a destination.
  return isPublicRoute(resolved.pathname)
    ? DEFAULT_ROUTE
    : `${resolved.pathname}${resolved.search}`;
}

/**
 * Appends the destination to a path, omitting it when it is the default.
 *
 * <p>So the ordinary sign-in stays a clean `/login` rather than `/login?next=%2Fdashboard`.
 */
export function withReturnTo(path: string, returnTo: string): string {
  if (returnTo === DEFAULT_ROUTE) {
    return path;
  }
  return `${path}?${RETURN_TO_PARAM}=${encodeURIComponent(returnTo)}`;
}

/** The sign-in URL that remembers where the visitor was going (AC#1). */
export function loginUrlFor(pathname: string, search = ""): string {
  if (isPublicRoute(pathname)) {
    return LOGIN_ROUTE;
  }
  return withReturnTo(LOGIN_ROUTE, safeReturnTo(`${pathname}${search}`));
}

/**
 * Pulls the destination out of a query string, already validated.
 *
 * <p>Takes a raw `location.search` rather than a parsed object so callers can read it inside an
 * event handler or effect. `useSearchParams()` would be the idiomatic hook, but it pulls the
 * calling client tree out of prerendering up to the nearest Suspense boundary, and none of these
 * pages need the value during render.
 *
 * <p>Validated on the way out as well as on the way in. The value made a round trip through a
 * URL the visitor can edit, so where it came from proves nothing about what it now says.
 */
export function returnToFrom(search: string): string {
  return safeReturnTo(new URLSearchParams(search).get(RETURN_TO_PARAM));
}
