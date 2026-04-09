"use server";

import { prisma } from "@/lib/prisma";
import { getTotalExpensesByDateRange } from "./expenses";

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  label?: string;
}

export interface StatusDistribution {
  name: string;
  value: number;
  percentage: number;
}

export interface InvoiceMetrics {
  totalRevenue: number;
  totalOutstanding: number;
  totalPaid: number;
  draftCount: number;
  totalExpenses: number;
  totalProfit: number;
}

/**
 * Get revenue aggregated by day for a date range
 * Uses paidDate if available, falls back to issueDate
 */
export async function getRevenueByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueDataPoint[]> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: "PAID",
      OR: [
        { paidDate: { gte: start, lte: end } },
        { AND: [{ paidDate: null }, { issueDate: { gte: start, lte: end } }] },
      ],
    },
    select: {
      paidDate: true,
      issueDate: true,
      totalGross: true,
    },
  });

  // Group by day using paidDate if available, else issueDate
  const dailyMap = new Map<string, number>();
  invoices.forEach((inv) => {
    const dateToUse = inv.paidDate || inv.issueDate;
    const dateStr = dateToUse.toISOString().split("T")[0];
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Number(inv.totalGross));
  });

  // Create data points for all days in range
  const data: RevenueDataPoint[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayNum = currentDate.getDate();

    data.push({
      date: dateStr,
      revenue: dailyMap.get(dateStr) || 0,
      label: `${dayNum}.`,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
}

/**
 * Get revenue aggregated by day for the last N days (deprecated - use getRevenueByDateRange)
 */
export async function getRevenueByDay(
  userId: string,
  days: number = 30
): Promise<RevenueDataPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getRevenueByDateRange(userId, startDate, endDate);
}

/**
 * Get revenue aggregated by week (ISO week)
 */
export async function getRevenueByWeek(
  userId: string,
  weeks: number = 13
): Promise<RevenueDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  startDate.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      issueDate: { gte: startDate },
      status: "PAID",
    },
    select: {
      issueDate: true,
      totalGross: true,
    },
  });

  // Group by ISO week
  const weeklyMap = new Map<string, { revenue: number; year: number }>();
  invoices.forEach((inv) => {
    const week = getISOWeek(inv.issueDate);
    const year = inv.issueDate.getFullYear();
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    const current = weeklyMap.get(key) || { revenue: 0, year };
    weeklyMap.set(key, {
      revenue: current.revenue + Number(inv.totalGross),
      year,
    });
  });

  // Create data points for all weeks in range
  const data: RevenueDataPoint[] = [];
  const currentDate = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i * 7);
    const week = getISOWeek(date);
    const year = date.getFullYear();
    const key = `${year}-W${String(week).padStart(2, "0")}`;

    data.push({
      date: key,
      revenue: weeklyMap.get(key)?.revenue || 0,
      label: `KW ${week}`,
    });
  }

  return data;
}

/**
 * Get revenue aggregated by month
 */
export async function getRevenueByMonth(
  userId: string,
  months: number = 12
): Promise<RevenueDataPoint[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      issueDate: { gte: startDate },
      status: "PAID",
    },
    select: {
      issueDate: true,
      totalGross: true,
    },
  });

  // Group by month
  const monthlyMap = new Map<string, number>();
  invoices.forEach((inv) => {
    const month = inv.issueDate.getMonth();
    const year = inv.issueDate.getFullYear();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(inv.totalGross));
  });

  // Create data points for all months in range
  const data: RevenueDataPoint[] = [];
  const currentDate = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthName = new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit" }).format(date);

    data.push({
      date: key,
      revenue: monthlyMap.get(key) || 0,
      label: monthName,
    });
  }

  return data;
}

/**
 * Get revenue aggregated by year (all-time)
 */
export async function getRevenueByYear(userId: string): Promise<RevenueDataPoint[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: "PAID",
    },
    select: {
      issueDate: true,
      totalGross: true,
    },
  });

  // Group by year
  const yearlyMap = new Map<string, number>();
  invoices.forEach((inv) => {
    const year = inv.issueDate.getFullYear();
    const key = String(year);
    yearlyMap.set(key, (yearlyMap.get(key) || 0) + Number(inv.totalGross));
  });

  // Create sorted data points
  const data: RevenueDataPoint[] = Array.from(yearlyMap, ([year, revenue]) => ({
    date: year,
    revenue,
    label: year,
  })).sort((a, b) => a.date.localeCompare(b.date));

  return data;
}

/**
 * Get distribution of invoices by status for date range
 * For PAID invoices, uses paidDate; otherwise uses issueDate
 */
export async function getStatusDistributionByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<StatusDistribution[]> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      OR: [
        { AND: [{ status: "PAID" }, { paidDate: { gte: start, lte: end } }] },
        {
          AND: [
            { status: { not: "PAID" } },
            { issueDate: { gte: start, lte: end } },
          ],
        },
      ],
    },
    select: { status: true },
  });

  const total = invoices.length;
  if (total === 0) {
    return [
      { name: "Entwurf", value: 0, percentage: 0 },
      { name: "Versendet", value: 0, percentage: 0 },
      { name: "Bezahlt", value: 0, percentage: 0 },
      { name: "Storniert", value: 0, percentage: 0 },
    ];
  }

  const statusMap = new Map<string, number>();
  invoices.forEach((inv) => {
    statusMap.set(inv.status, (statusMap.get(inv.status) || 0) + 1);
  });

  const statusNames: { [key: string]: string } = {
    DRAFT: "Entwurf",
    SENT: "Versendet",
    PAID: "Bezahlt",
    CANCELLED: "Storniert",
  };

  return Object.entries(statusNames).map(([key, name]) => {
    const value = statusMap.get(key) || 0;
    return {
      name,
      value,
      percentage: Math.round((value / total) * 100),
    };
  });
}

/**
 * Get distribution of invoices by status (deprecated - use getStatusDistributionByDateRange)
 */
export async function getStatusDistribution(userId: string): Promise<StatusDistribution[]> {
  return getStatusDistributionByDateRange(userId, new Date(0), new Date());
}

/**
 * Get key metrics for date range
 * For PAID invoices, uses paidDate; otherwise uses issueDate
 */
export async function getInvoiceMetricsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<InvoiceMetrics> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      OR: [
        { AND: [{ status: "PAID" }, { paidDate: { gte: start, lte: end } }] },
        {
          AND: [
            { status: { not: "PAID" } },
            { issueDate: { gte: start, lte: end } },
          ],
        },
      ],
    },
    select: {
      status: true,
      totalGross: true,
    },
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.totalGross), 0);

  const totalExpenses = await getTotalExpensesByDateRange(userId, startDate, endDate);

  return {
    totalRevenue,
    totalOutstanding: invoices
      .filter((inv) => inv.status === "SENT")
      .reduce((sum, inv) => sum + Number(inv.totalGross), 0),
    totalPaid: invoices.filter((inv) => inv.status === "PAID").length,
    draftCount: invoices.filter((inv) => inv.status === "DRAFT").length,
    totalExpenses,
    totalProfit: totalRevenue - totalExpenses,
  };
}

/**
 * Get key metrics (deprecated - use getInvoiceMetricsByDateRange)
 */
export async function getInvoiceMetrics(userId: string): Promise<InvoiceMetrics> {
  return getInvoiceMetricsByDateRange(userId, new Date(0), new Date());
}

/**
 * Helper: Get ISO week number
 */
function getISOWeek(date: Date): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() - target.getDay() + (target.getDay() === 0 ? -6 : 1));
  const week1 = new Date(target.getFullYear(), 0, 4);
  week1.setHours(0, 0, 0, 0);
  week1.setDate(week1.getDate() - week1.getDay() + (week1.getDay() === 0 ? -6 : 1));
  const days = Math.round((target.getTime() - week1.getTime()) / 86400000);
  return Math.floor(days / 7) + 1;
}
