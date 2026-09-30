import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges class names and resolves Tailwind conflicts in favor of later values. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
