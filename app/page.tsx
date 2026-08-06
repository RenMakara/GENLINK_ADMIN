import { useTranslations } from "next-intl";

/**
 * Placeholder home page.
 *
 * <p>Exists to prove the i18n wiring end to end (ADM-012): if the plugin, `i18n/request.ts`
 * or the provider were misconfigured, these would render as their keys rather than as English.
 *
 * <p>Replaced by the real dashboard in ADM-056. The route structure arrives with the app shell
 * in ADM-034.
 */
export default function Home() {
  // A Server Component may call useTranslations directly - no await, no client boundary.
  const t = useTranslations("App");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("name")}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("tagline")}</p>
    </main>
  );
}
