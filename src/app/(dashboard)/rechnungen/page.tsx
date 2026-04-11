import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RechnungenClient } from "./rechnungen-client";
import { getServerLanguage } from "@/lib/get-server-language";

export default async function RechnungenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { t } = getServerLanguage();

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const serialized = invoices.map((inv) => ({
    ...inv,
    totalGross: Number(inv.totalGross),
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.invoices.title}</h1>
          <p className="text-muted-foreground mt-1">{invoices.length} {t.invoices.total}</p>
        </div>
        <Link href="/rechnungen/neu">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.invoices.new}
          </Button>
        </Link>
      </div>
      <RechnungenClient invoices={serialized} />
    </div>
  );
}
