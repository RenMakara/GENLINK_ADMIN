"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CHART_PALETTE, CHART_THEME_COLORS, getChartColor } from "./chart-colors";

export interface HorizontalBarChartProps {
  data: Array<Record<string, unknown>>;
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: string) => string;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

/** Recharts horizontal bar wrapper for ranked distributions such as universities. */
export function HorizontalBarChart({
  data,
  index,
  categories,
  colors = [...CHART_PALETTE],
  valueFormatter = (value: number) => new Intl.NumberFormat("en-US").format(value),
  labelFormatter,
  height = 300,
  showGrid = true,
  className,
}: HorizontalBarChartProps) {
  const { resolvedTheme } = useTheme();
  const themeColors = resolvedTheme === "dark" ? CHART_THEME_COLORS.dark : CHART_THEME_COLORS.light;
  const shouldReduceMotion = useReducedMotion();

  if (!data || data.length === 0) return null;

  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 8, bottom: 0 }}
          barCategoryGap="18%"
        >
          {showGrid ? (
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} horizontal={false} />
          ) : null}
          <XAxis
            type="number"
            stroke={themeColors.axisTick}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => valueFormatter(value)}
          />
          <YAxis
            type="category"
            dataKey={index}
            width={112}
            stroke={themeColors.axisTick}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) => labelFormatter ? labelFormatter(value) : value}
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
          />
          {categories.map((category, indexValue) => (
            <Bar
              key={category}
              dataKey={category}
              fill={getChartColor(indexValue, colors)}
              radius={[0, 4, 4, 0]}
              isAnimationActive={!shouldReduceMotion}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
