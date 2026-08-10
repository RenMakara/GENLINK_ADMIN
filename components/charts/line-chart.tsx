"use client";

import { useTheme } from "next-themes";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_PALETTE, CHART_THEME_COLORS, getChartColor } from "./chart-colors";

export interface LineChartProps {
  /** Array of data objects */
  data: Array<Record<string, unknown>>;
  /** Key name for X-axis categories (e.g. "date") */
  index: string;
  /** Keys for series metrics to plot as lines */
  categories: string[];
  /** Custom colors array overriding CHART_PALETTE */
  colors?: string[];
  /** Value formatting function for Y-axis and tooltip */
  valueFormatter?: (value: number) => string;
  /** Label/date formatting function for X-axis ticks */
  labelFormatter?: (value: string) => string;
  /** Chart height in pixels (default: 300) */
  height?: number;
  /** Show legend (default: true if categories.length > 1) */
  showLegend?: boolean;
  /** Show background grid lines (default: true) */
  showGrid?: boolean;
  /** CSS class name for container */
  className?: string;
}

/**
 * Recharts LineChart wrapper for comparative multi-series line trends (ADM-050).
 */
export function LineChart({
  data,
  index,
  categories,
  colors = [...CHART_PALETTE],
  valueFormatter = (val: number) => new Intl.NumberFormat("en-US").format(val),
  labelFormatter,
  height = 300,
  showLegend,
  showGrid = true,
  className,
}: LineChartProps) {
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
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          {showGrid ? (
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
          ) : null}

          <XAxis
            dataKey={index}
            stroke={themeColors.axisTick}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={labelFormatter}
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
              labelFormatter ? labelFormatter(String(label)) : String(label)
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
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
