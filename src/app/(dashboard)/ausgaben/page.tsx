import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExpensesClient } from "./expenses-client";

export default async function AusgabenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const expenses = await prisma.expense.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <ExpensesClient
      expenses={expenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        date: e.date,
        category: e.category,
        notes: e.notes,
      }))}
      totalAmount={totalAmount}
    />
  );
}
