import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/config/env";

/**
 * Which deployment you are looking at (SSOT §3).
 *
 * <p><strong>Not decoration.</strong> Staff will have staging and production open in adjacent
 * tabs, and "ban user" is not an action you want to take against the wrong database. This badge
 * is the only thing on screen that distinguishes them.
 *
 * <p>Hidden in production, on the reasoning that the dangerous mistake is acting on production
 * while believing you are on staging — so the warning belongs on the environment you are
 * *allowed* to break. A permanent "PROD" badge would also become invisible through familiarity
 * within a week.
 */
export function EnvironmentBadge() {
  if (env.NEXT_PUBLIC_ENVIRONMENT === "production") {
    return null;
  }

  const isStaging = env.NEXT_PUBLIC_ENVIRONMENT === "staging";

  return (
    <Badge
      variant={isStaging ? "destructive" : "secondary"}
      // Announced, not just seen: an admin using a screen reader needs to know which database
      // they are about to act on just as much as a sighted one.
      aria-label={`Environment: ${isStaging ? "staging" : "development"}`}
      className="shrink-0 font-mono text-[10px] tracking-wider uppercase"
    >
      {isStaging ? "Staging" : "Dev"}
    </Badge>
  );
}
