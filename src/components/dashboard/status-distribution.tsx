"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import type { StatusDistribution } from "@/lib/actions/invoice-analytics";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

interface StatusDistributionChartProps {
  data: StatusDistribution[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#1e40af",
  PAID: "#52B876",
  CANCELLED: "#9ca3af",
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const [isDark, setIsDark] = useState(false);
  const { t } = useLanguage();

  const labelMap: Record<string, string> = {
    DRAFT: t.invoices.draft,
    PAID: t.invoices.paid,
    CANCELLED: t.invoices.cancelled,
  };

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const translatedData = data.map((item) => ({
    ...item,
    displayName: labelMap[item.name] ?? item.name,
  }));

  const filteredData = translatedData.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="border border-border p-6 bg-card h-80 flex items-center justify-center shadow-card">
        <p className="text-muted-foreground">{t.invoices.noInvoices}</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const d = payload[0].payload;
      return (
        <div className="p-3 border border-border bg-card shadow-card">
          <p className="text-sm font-medium text-foreground">{d.displayName}</p>
          <p className="text-sm font-semibold text-primary font-mono">
            {d.value} {d.value !== 1 ? (t.nav.invoices).toLowerCase() : t.nav.invoices.replace(/n$/, "").toLowerCase()}
          </p>
          <p className="text-sm text-muted-foreground">{d.percentage}%</p>
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
          {t.dashboard.statusDistribution}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.statusDesc}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }: any) => `${name}: ${Math.round((percent ?? 0) * 100)}%`}
            outerRadius={80}
            dataKey="value"
            nameKey="displayName"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] ?? "#9ca3af"} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => value} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
