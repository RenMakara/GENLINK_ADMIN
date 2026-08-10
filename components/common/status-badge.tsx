import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusPresentation } from "@/lib/ui/status";

/**
 * An account status as a pill (ADM-040, SSOT §11.2).
 *
 * <p>The colour is a convenience; the word is the guarantee. Every status renders its label as
 * text, so an operator who cannot distinguish the hues — roughly 1 in 12 men — still reads
 * "Banned" rather than guessing from a red they cannot see. The colour choices and the
 * text-always rule both live in {@link statusPresentation}, which is unit-tested; this component
 * only draws what that returns.
 */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { label, className: tone } = statusPresentation(status);

  return (
    <Badge className={cn(tone, className)} data-status={status}>
      {label}
    </Badge>
  );
}
