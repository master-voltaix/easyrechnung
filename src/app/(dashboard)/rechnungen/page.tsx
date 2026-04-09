import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RechnungenClient } from "./rechnungen-client";

export default async function RechnungenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

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
          <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="text-gray-600 mt-1">{invoices.length} Rechnungen gesamt</p>
        </div>
        <Link href="/rechnungen/neu">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Rechnung
          </Button>
        </Link>
      </div>
      <RechnungenClient invoices={serialized} />
    </div>
  );
}
