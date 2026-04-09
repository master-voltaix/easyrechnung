"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, FileText } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusDistributionChart } from "@/components/dashboard/status-distribution";
import { DateRangeSelector, type DateRange } from "@/components/dashboard/date-range-selector";
import {
  getRevenueByDateRange,
  getStatusDistributionByDateRange,
  getInvoiceMetricsByDateRange,
} from "@/lib/actions/invoice-analytics";
import type { RevenueDataPoint, StatusDistribution, InvoiceMetrics } from "@/lib/actions/invoice-analytics";

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

  // Determine time unit for chart based on date range
  const getDaysDifference = () => {
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysDiff = getDaysDifference();
  let timeUnit: "day" | "week" | "month" | "year";

  if (daysDiff === 0) {
    timeUnit = "day";
  } else if (daysDiff <= 30) {
    timeUnit = "day";
  } else if (daysDiff <= 180) {
    timeUnit = "week";
  } else {
    timeUnit = "month";
  }

  return (
    <>
      {/* Date Range Selector */}
      <div className="mb-8">
        <DateRangeSelector selectedRange={dateRange} onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Loading state */}
      {loading && <div className="text-center py-4 text-muted-foreground">Wird geladen...</div>}

      {/* Revenue Chart */}
      <div className="mb-8">
        <RevenueChart data={revenueData} timeUnit={timeUnit} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <StatusDistributionChart data={statusData} />

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtumsatz</CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{formatEuro(metrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Bezahlte Rechnungen</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtgewinn</CardTitle>
              <TrendingDown className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-2 ${metrics.totalProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                {formatEuro(metrics.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Umsatz − Ausgaben ({formatEuro(metrics.totalExpenses)})</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bezahlt</CardTitle>
              <CheckCircle className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{metrics.totalPaid}</div>
              <p className="text-xs text-muted-foreground">Rechnungen insgesamt</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entwürfe</CardTitle>
              <FileText className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{metrics.draftCount}</div>
              <p className="text-xs text-muted-foreground">Nicht versendet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
