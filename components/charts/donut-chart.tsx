"use client";

import { useTheme } from "next-themes";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CHART_PALETTE, CHART_THEME_COLORS, getChartColor } from "./chart-colors";

export interface DonutChartDataItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface DonutChartProps {
  /** Array of slice items: { name: string, value: number, color?: string } */
  data: DonutChartDataItem[];
  /** Custom colors array overriding CHART_PALETTE */
  colors?: string[];
  /** Value formatting function */
  valueFormatter?: (value: number) => string;
  /** Height in pixels (default: 300) */
  height?: number;
  /** Center label text (e.g. "1,240") */
  centerLabel?: string | number;
  /** Center sublabel text (e.g. "Total Users") */
  centerSublabel?: string;
  /** Show legend (default: true) */
  showLegend?: boolean;
  /** CSS class name */
  className?: string;
}

/** Donut chart wrapper for status and proportional data. */
export function DonutChart({
  data,
  colors = [...CHART_PALETTE],
  valueFormatter = (val: number) => new Intl.NumberFormat("en-US").format(val),
  height = 300,
  centerLabel,
  centerSublabel,
  showLegend = true,
  className,
}: DonutChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const themeColors = isDark ? CHART_THEME_COLORS.dark : CHART_THEME_COLORS.light;

  const shouldReduceMotion = useReducedMotion();

  if (!data || data.length === 0) {
    return null;
  }

  const total = data.reduce((acc, item) => acc + (item.value || 0), 0);
  const displayCenterLabel = centerLabel ?? new Intl.NumberFormat("en-US").format(total);

  return (
    <div className={className} style={{ width: "100%", height, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            isAnimationActive={!shouldReduceMotion}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color || getChartColor(idx, colors)} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: themeColors.tooltipBg,
              borderColor: themeColors.tooltipBorder,
              borderRadius: "0.5rem",
              color: themeColors.tooltipText,
              fontSize: "0.75rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: unknown) =>
              typeof value === "number"
                ? [
                    `${valueFormatter(value)} (${
                      total > 0 ? ((value / total) * 100).toFixed(1) : 0
                    }%)`,
                    "",
                  ]
                : [String(value), ""]
            }
          />

          {showLegend ? (
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
            />
          ) : null}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Center text overlay for donut chart */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-foreground">
          {displayCenterLabel}
        </span>
        {centerSublabel ? (
          <span className="text-muted-foreground text-xs font-medium">{centerSublabel}</span>
        ) : null}
      </div>
    </div>
  );
}
