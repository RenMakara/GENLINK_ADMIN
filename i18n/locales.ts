/** Locales supported by the admin portal. */
export const locales = ['en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Uses a fixed locale without adding locale segments to route URLs. */
export const usesLocaleRouting = false;
