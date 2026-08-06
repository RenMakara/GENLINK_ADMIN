import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names, resolving Tailwind conflicts so the last one wins.
 *
 * `cn("p-2", "p-4")` gives `"p-4"` rather than both — which is what makes a component's
 * `className` prop able to override its defaults instead of fighting them.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
