import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusPresentation } from "@/lib/ui/status";

/** Account status pill with an accessible text label. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { label, className: tone } = statusPresentation(status);

  return (
    <Badge className={cn(tone, className)} data-status={status}>
      {label}
    </Badge>
  );
}
