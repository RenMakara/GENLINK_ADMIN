import type { Locale } from './i18n/locales';
import type messages from './messages/en.json';

/**
 * Makes translation keys type-safe.
 *
 * <p>With this, `t('Common.retry')` compiles and `t('Common.rety')` does not. That matters
 * more than it looks: a mistyped key does not throw at runtime — next-intl renders the key
 * itself, so the mistake ships as a screen displaying `Common.rety` to a member of staff.
 *
 * <p>English is the source of truth for the key set. When Khmer is added, `km.json` is checked
 * against these keys rather than the other way round, so a missing Khmer string is a visible
 * gap instead of a new key nobody translated.
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
