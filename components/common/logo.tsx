"use client";

import { cn } from "@/lib/utils";
import { env } from "@/lib/config/env";

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

/** GenLink logo with theme-aware assets and basePath support. */
export function GenLinkLogo({
  size = "md",
  iconOnly = false,
  suffix,
  className,
}: LogoProps) {
  const config = SIZE_MAP[size];
  const basePath = env.NEXT_PUBLIC_BASE_PATH || "";
  const lightLogoSrc = `${basePath}/genlink_logo_light.png`;
  const darkLogoSrc = `${basePath}/genlink_logo_dark.png`;

  return (
    <div className={cn("flex items-center gap-2.5 shrink-0 select-none", className)}>
      <img
        src={lightLogoSrc}
        alt="GenLink KH Logo"
        width={config.dimensions}
        height={config.dimensions}
        className="object-contain shrink-0 dark:hidden"
        style={{ width: config.dimensions, height: config.dimensions }}
      />
      <img
        src={darkLogoSrc}
        alt="GenLink KH Logo"
        width={config.dimensions}
        height={config.dimensions}
        className="hidden object-contain shrink-0 dark:block"
        style={{ width: config.dimensions, height: config.dimensions }}
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
