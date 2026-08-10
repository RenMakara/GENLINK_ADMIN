/**
 * The standard GenLink chart color palette from SSOT §11.2 and ADM-050.
 *
 * <p>Categorical series draw from GenLink brand greens and cohesive neutral accents so charts
 * remain recognisably GenLink without relying on random rainbow hues.
 *
 * <p>Sequential scales run from light to dark green.
 */

/** Categorical series palette (SSOT §11.2) */
export const CHART_PALETTE = [
  "#1F5B3A", // Primary Deep Green
  "#4BAE73", // Primary Mid Green
  "#BDF4D3", // Accent Light Green
  "#0F766E", // Deep Teal
  "#84CC16", // Lime Accent
  "#64748B", // Muted Slate
  "#334155", // Dark Slate
  "#94A3B8", // Light Slate
] as const;

/** Sequential scale running light -> dark green */
export const SEQUENTIAL_GREEN_SCALE = [
  "#BDF4D3",
  "#4BAE73",
  "#1F5B3A",
  "#143C26",
] as const;

/**
 * Gets the color for a category by index.
 */
export function getChartColor(index: number, customColors?: readonly string[]): string {
  const palette = customColors && customColors.length > 0 ? customColors : CHART_PALETTE;
  return palette[index % palette.length];
}

/** Theme-aware default colors for chart SVG elements */
export const CHART_THEME_COLORS = {
  light: {
    grid: "#E2E8F0",
    axisTick: "#64748B",
    tooltipBg: "#FFFFFF",
    tooltipBorder: "#E2E8F0",
    tooltipText: "#0E1621",
    subtleText: "#55637A",
  },
  dark: {
    grid: "#1E2A38",
    axisTick: "#94A3B8",
    tooltipBg: "#16202C",
    tooltipBorder: "#263445",
    tooltipText: "#F8FAFC",
    subtleText: "#94A3B8",
  },
} as const;
