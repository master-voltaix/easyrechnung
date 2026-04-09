"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import type { StatusDistribution } from "@/lib/actions/invoice-analytics";
import { useEffect, useState } from "react";

interface StatusDistributionChartProps {
  data: StatusDistribution[];
}

const COLORS: { [key: string]: string } = {
  "Entwurf": "#1e40af",       // Dark Blue
  "Versendet": "#3b82f6",     // Bright Blue
  "Bezahlt": "#10b981",       // Green
  "Storniert": "#0ea5e9",     // Light Blue
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="border border-border rounded-xl p-6 bg-card h-80 flex items-center justify-center">
        <p className="text-muted-foreground">Noch keine Rechnungen vorhanden</p>
      </div>
    );
  }

  const tooltipBg = isDark ? "#1a2332" : "#ffffff";
  const tooltipBorder = isDark ? "#2d3a4d" : "#e9d5ff";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 border rounded-lg shadow-lg ${isDark ? "bg-card border-border" : "bg-white border-border"}`}>
          <p className={`text-sm font-medium ${isDark ? "text-foreground" : "text-foreground"}`}>{data.name}</p>
          <p className="text-sm font-semibold text-primary">{data.value} Rechnung{data.value !== 1 ? "en" : ""}</p>
          <p className={`text-sm ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-border rounded-xl p-6 bg-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Rechnungsstatus</h3>
        <p className="text-sm text-muted-foreground mt-1">Verteilung nach Status</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${Math.round((percent ?? 0) * 100)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#9ca3af"} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
