import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/config/env";

/** Identifies non-production deployments; hidden in production. */
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
