/**
 * Locales the admin portal can render.
 *
 * <p>English only for now, by decision (ADM-012). Khmer is expected later: the admin UI is
 * staff-facing and English-first, while the *product* is Khmer-first — so the two do not move
 * together.
 *
 * next-intl is wired up now rather than at that point because retrofitting it across ~25
 * screens is far more expensive than carrying it from the first screen. Adding `'km'` here
 * plus a `messages/km.json` is then most of the work.
 */
export const locales = ['en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * The portal renders in one fixed locale and does **not** use i18n routing: no `[locale]`
 * URL segment, and no next-intl middleware.
 *
 * That is a deliberate constraint, not just simplicity. Next 16's `proxy.ts` is a single
 * entry point, and ADM-039 needs it for the authentication route guard. Adding next-intl's
 * routing middleware would put two things in that one place and make the ordering between
 * "redirect to /login" and "resolve the locale" something a reader has to reason about.
 *
 * When Khmer arrives, prefer a cookie- or profile-driven locale over a URL segment for the
 * same reason.
 */
export const usesLocaleRouting = false;
