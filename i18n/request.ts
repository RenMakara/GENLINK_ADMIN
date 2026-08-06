import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from './locales';

/**
 * Per-request i18n configuration, read by next-intl on the server.
 *
 * <p>There is no `[locale]` segment to resolve from, so the locale is fixed (ADM-012). When a
 * second locale arrives this is the one place that decides it — from a cookie or the admin's
 * profile — and nothing else in the app has to change.
 *
 * <p>`timeZone` is pinned to `Asia/Phnom_Penh` rather than left to the server's zone. Any date
 * next-intl formats has to agree with the dedicated formatter in `lib/utils/date.ts`
 * (ADM-018); two components rendering the same instant differently, depending on which helper
 * they happened to use, is the kind of inconsistency nobody notices until a number is
 * questioned.
 */
export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Phnom_Penh',
  };
});
