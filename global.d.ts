import type { Locale } from './i18n/locales';
import type messages from './messages/en.json';

/** Type-checks translation keys against the English locale. */
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
