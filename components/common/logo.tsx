import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /** Size variant: "sm" (24px), "md" (32px), "lg" (44px) */
  size?: "sm" | "md" | "lg";
  /** Hide text label (show icon only) */
  iconOnly?: boolean;
  /** Optional subtitle or suffix text (e.g. "Admin") */
  suffix?: string;
  /** Custom container class */
  className?: string;
}

const SIZE_MAP = {
  sm: { dimensions: 24, textClass: "text-sm font-semibold" },
  md: { dimensions: 32, textClass: "text-base font-semibold" },
  lg: { dimensions: 44, textClass: "text-xl font-bold" },
};

/**
 * GenLink KH Brand Logo component displaying the official GenLink logo icon (public/genlink_logo.png).
 */
export function GenLinkLogo({
  size = "md",
  iconOnly = false,
  suffix,
  className,
}: LogoProps) {
  const config = SIZE_MAP[size];

  return (
    <div className={cn("flex items-center gap-2.5 shrink-0 select-none", className)}>
      <Image
        src="/genlink_logo.png"
        alt="GenLink KH Logo"
        width={config.dimensions}
        height={config.dimensions}
        className="object-contain shrink-0"
        priority
      />
      {!iconOnly && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("tracking-tight text-foreground truncate", config.textClass)}>
            GenLink KH
          </span>
          {suffix && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
