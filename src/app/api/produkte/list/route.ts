import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { userId: session.user.id },
    orderBy: { title: "asc" },
  });

  // Convert Decimal to number for JSON serialization
  const serialized = products.map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    vatRate: Number(p.vatRate),
  }));

  return NextResponse.json({ products: serialized });
}
