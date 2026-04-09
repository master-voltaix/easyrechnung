import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id },
    select: { id: true, companyName: true, street: true, postalCode: true, city: true, contactPerson: true },
    orderBy: { companyName: "asc" },
  });

  return NextResponse.json({ customers });
}
