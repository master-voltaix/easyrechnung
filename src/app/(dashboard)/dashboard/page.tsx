import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "./dashboard-client";
import { RecentInvoicesTable } from "./recent-invoices-table";
import {
  getRevenueByDateRange,
  getStatusDistributionByDateRange,
  getInvoiceMetricsByDateRange,
} from "@/lib/actions/invoice-analytics";
import { getServerLanguage } from "@/lib/get-server-language";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { t } = getServerLanguage();

  const userId = session.user.id;

  // Default: Last 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  // Fetch initial data server-side
  const [initialRevenue, initialStatusDist, initialMetrics, recentInvoices] = await Promise.all([
    getRevenueByDateRange(userId, thirtyDaysAgo, today),
    getStatusDistributionByDateRange(userId, thirtyDaysAgo, today),
    getInvoiceMetricsByDateRange(userId, thirtyDaysAgo, today),
    prisma.invoice.findMany({
      where: { userId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const initialDateRange = { from: thirtyDaysAgo, to: today };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
        <p className="text-muted-foreground mt-1">{t.dashboard.welcome}</p>
      </div>

      {/* Client-side dashboard with charts */}
      <DashboardClient
        userId={userId}
        initialDateRange={initialDateRange}
        initialRevenue={initialRevenue}
        initialStatusDist={initialStatusDist}
        initialMetrics={initialMetrics}
      />

      {/* Recent Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.recentInvoices}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentInvoicesTable
            invoices={recentInvoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              issueDate: inv.issueDate,
              totalGross: Number(inv.totalGross),
              status: inv.status,
              customer: { companyName: inv.customer.companyName },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
