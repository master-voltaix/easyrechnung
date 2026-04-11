"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatEuro } from "@/lib/utils";
import type { RevenueDataPoint } from "@/lib/actions/invoice-analytics";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  timeUnit: "day" | "week" | "month" | "year";
}

export function RevenueChart({ data, timeUnit }: RevenueChartProps) {
  const [isDark, setIsDark] = useState(false);
  const { t } = useLanguage();

  const timeUnitLabels: Record<string, string> = {
    day: t.dashboard.daily,
    week: t.dashboard.weekly,
    month: t.dashboard.monthly,
    year: t.dashboard.monthly,
  };

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
      <div className="h-80 flex items-center justify-center border border-border bg-card">
        <p className="text-muted-foreground">{t.common.noData}</p>
      </div>
    );
  }

  const gridColor = isDark ? "#2d3a4d" : "#e8e2d6";
  const axisColor = isDark ? "#7b94b3" : "#9a9088";
  const textColor = isDark ? "#7b94b3" : "#9a9088";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const point = payload[0].payload;
      return (
        <div className="p-3 border border-border bg-card shadow-card">
          <p className="text-sm font-medium text-foreground">{point.label || point.date}</p>
          <p className="text-sm font-semibold text-primary font-mono">{formatEuro(point.revenue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-border p-6 bg-card shadow-card">
      <div className="mb-4">
        <h3
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
        >
          {t.dashboard.revenueChart} ({timeUnitLabels[timeUnit]})
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.bookedInvoices}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} vertical={false} />
          <XAxis dataKey="label" stroke={axisColor} style={{ fontSize: "12px" }} tick={{ fill: textColor }} />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: "12px" }}
            tick={{ fill: textColor }}
            tickFormatter={(value) => {
              if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
              return `€${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(82,184,118,0.08)" }} />
          <Bar
            dataKey="revenue"
            fill="#52B876"
            radius={[2, 2, 0, 0]}
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
