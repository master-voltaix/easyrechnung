"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatEuro } from "@/lib/utils";
import type { RevenueDataPoint } from "@/lib/actions/invoice-analytics";
import { useEffect, useState } from "react";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  timeUnit: "day" | "week" | "month" | "year";
}

const timeUnitLabels: { [key: string]: string } = {
  day: "Täglich",
  week: "Wöchentlich",
  month: "Monatlich",
  year: "Jährlich",
};

export function RevenueChart({ data, timeUnit }: RevenueChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center border border-border rounded-xl bg-card/50">
        <p className="text-muted-foreground">Keine Daten für diese Periode</p>
      </div>
    );
  }

  const lineColor = "#3b82f6";
  const gridColor = isDark ? "#2d3a4d" : "#f0e5ff";
  const axisColor = isDark ? "#7b94b3" : "#6d5a7a";
  const textColor = isDark ? "#7b94b3" : "#6d5a7a";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const point = payload[0].payload;
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${isDark ? "bg-card border-border" : "bg-white border-border"}`}>
          <p className="text-sm font-medium text-foreground">{point.label || point.date}</p>
          <p className="text-sm font-semibold text-primary">{formatEuro(point.revenue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-border rounded-xl p-6 bg-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Umsatzentwicklung ({timeUnitLabels[timeUnit]})</h3>
        <p className="text-sm text-muted-foreground mt-1">Gebuchte Rechnungen</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
          <XAxis
            dataKey="label"
            stroke={axisColor}
            style={{ fontSize: "12px" }}
            tick={{ fill: textColor }}
          />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: "12px" }}
            tick={{ fill: textColor }}
            tickFormatter={(value) => {
              if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
              return `€${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotoneX"
            dataKey="revenue"
            stroke="url(#lineGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: lineColor, strokeWidth: 2, stroke: "#fff" }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
