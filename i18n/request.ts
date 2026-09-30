import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from './locales';

/** Server-side locale and timezone settings for next-intl. */
export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Phnom_Penh',
  };
});
