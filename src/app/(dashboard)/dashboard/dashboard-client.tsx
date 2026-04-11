"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, FileText, RefreshCw } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusDistributionChart } from "@/components/dashboard/status-distribution";
import { DateRangeSelector, type DateRange } from "@/components/dashboard/date-range-selector";
import {
  getRevenueByDateRange,
  getStatusDistributionByDateRange,
  getInvoiceMetricsByDateRange,
} from "@/lib/actions/invoice-analytics";
import type { RevenueDataPoint, StatusDistribution, InvoiceMetrics } from "@/lib/actions/invoice-analytics";
import { useLanguage } from "@/components/language-provider";

interface DashboardClientProps {
  userId: string;
  initialDateRange: DateRange;
  initialRevenue: RevenueDataPoint[];
  initialStatusDist: StatusDistribution[];
  initialMetrics: InvoiceMetrics;
}

export function DashboardClient({
  userId,
  initialDateRange,
  initialRevenue,
  initialStatusDist,
  initialMetrics,
}: DashboardClientProps) {
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>(initialRevenue);
  const [statusData, setStatusData] = useState<StatusDistribution[]>(initialStatusDist);
  const [metrics, setMetrics] = useState<InvoiceMetrics>(initialMetrics);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleDateRangeChange = async (newRange: DateRange) => {
    setLoading(true);
    try {
      setDateRange(newRange);
      const [revenue, status, newMetrics] = await Promise.all([
        getRevenueByDateRange(userId, newRange.from, newRange.to),
        getStatusDistributionByDateRange(userId, newRange.from, newRange.to),
        getInvoiceMetricsByDateRange(userId, newRange.from, newRange.to),
      ]);
      setRevenueData(revenue);
      setStatusData(status);
      setMetrics(newMetrics);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysDifference = () => {
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysDiff = getDaysDifference();
  let timeUnit: "day" | "week" | "month" | "year";
  if (daysDiff === 0) timeUnit = "day";
  else if (daysDiff <= 30) timeUnit = "day";
  else if (daysDiff <= 180) timeUnit = "week";
  else timeUnit = "month";

  return (
    <>
      <div className="mb-8 flex items-center gap-2">
        <DateRangeSelector selectedRange={dateRange} onDateRangeChange={handleDateRangeChange} />
        <button
          type="button"
          onClick={() => handleDateRangeChange(dateRange)}
          disabled={loading}
          title="Aktualisieren"
          className="flex items-center justify-center h-10 w-10 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 disabled:opacity-50"
          style={{ borderRadius: "2px" }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">{t.dashboard.loading}</div>
      )}

      <div className="mb-8">
        <RevenueChart data={revenueData} timeUnit={timeUnit} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <StatusDistributionChart data={statusData} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
                {t.dashboard.totalRevenue}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#52B876]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1 font-mono">{formatEuro(metrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">{t.dashboard.paidInvoices}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
                {t.dashboard.totalProfit}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-[#52B876]" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold mb-1 font-mono ${metrics.totalProfit >= 0 ? "text-[#52B876]" : "text-destructive"}`}>
                {formatEuro(metrics.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground">{t.dashboard.profitDesc} ({formatEuro(metrics.totalExpenses)})</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
                {t.dashboard.paidCount}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-[#52B876]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1 font-mono">{metrics.totalPaid}</div>
              <p className="text-xs text-muted-foreground">{t.dashboard.invoicesTotal}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-mono font-medium tracking-wider uppercase text-muted-foreground">
                {t.dashboard.drafts}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1 font-mono">{metrics.draftCount}</div>
              <p className="text-xs text-muted-foreground">{t.dashboard.notSent}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
