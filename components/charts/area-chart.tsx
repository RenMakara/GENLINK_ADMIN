"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_PALETTE, CHART_THEME_COLORS, getChartColor } from "./chart-colors";

export interface AreaChartProps {
  /** Array of data objects */
  data: Array<Record<string, unknown>>;
  /** Key name for X-axis categories (e.g. "date") */
  index: string;
  /** Keys for series metrics to plot as areas (e.g. ["activeUsers", "totalUsers"]) */
  categories: string[];
  /** Custom colors array overriding CHART_PALETTE */
  colors?: string[];
  /** Value formatting function for Y-axis and tooltip (default: String) */
  valueFormatter?: (value: number) => string;
  /** Date/label formatting function for X-axis ticks */
  dateFormatter?: (value: string) => string;
  /** Chart height in pixels (default: 300) */
  height?: number;
  /** Show legend (default: true if categories.length > 1) */
  showLegend?: boolean;
  /** Show background grid lines (default: true) */
  showGrid?: boolean;
  /** Stack areas on top of each other (default: false) */
  stacked?: boolean;
  /** CSS class name for container */
  className?: string;
}

/**
 * Recharts AreaChart wrapper for trend and cumulative metric plots (ADM-050).
 */
export function AreaChart({
  data,
  index,
  categories,
  colors = [...CHART_PALETTE],
  valueFormatter = (val: number) => new Intl.NumberFormat("en-US").format(val),
  dateFormatter,
  height = 300,
  showLegend,
  showGrid = true,
  stacked = false,
  className,
}: AreaChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const themeColors = isDark ? CHART_THEME_COLORS.dark : CHART_THEME_COLORS.light;

  if (!data || data.length === 0) {
    return null;
  }

  const legendVisible = showLegend ?? categories.length > 1;

  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            {categories.map((category, idx) => {
              const color = getChartColor(idx, colors);
              return (
                <linearGradient
                  key={category}
                  id={`area-gradient-${category.replace(/\s+/g, "-")}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              );
            })}
          </defs>

          {showGrid ? (
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
          ) : null}

          <XAxis
            dataKey={index}
            stroke={themeColors.axisTick}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={dateFormatter}
          />

          <YAxis
            stroke={themeColors.axisTick}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => valueFormatter(val)}
          />

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
              typeof value === "number" ? [valueFormatter(value), ""] : [String(value), ""]
            }
            labelFormatter={(label: unknown) =>
              dateFormatter ? dateFormatter(String(label)) : String(label)
            }
          />

          {legendVisible ? (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: "0.75rem", paddingBottom: "0.5rem" }}
            />
          ) : null}

          {categories.map((category, idx) => {
            const color = getChartColor(idx, colors);
            return (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#area-gradient-${category.replace(/\s+/g, "-")})`}
                stackId={stacked ? "stack" : undefined}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
