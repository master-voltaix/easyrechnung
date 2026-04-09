import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // Serialize Decimal fields
  const serialized = {
    ...invoice,
    subtotalNet: Number(invoice.subtotalNet),
    totalVat: Number(invoice.totalVat),
    totalGross: Number(invoice.totalGross),
    discountValue: invoice.discountValue ? Number(invoice.discountValue) : null,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    serviceDate: invoice.serviceDate?.toISOString() ?? null,
    items: invoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      lineTotalNet: Number(item.lineTotalNet),
    })),
  };

  return NextResponse.json({ invoice: serialized });
}
