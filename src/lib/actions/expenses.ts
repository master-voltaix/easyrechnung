"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ExpenseInput {
  description: string;
  amount: number;
  date: string;
  category?: string;
  notes?: string;
}

export async function createExpense(input: ExpenseInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  try {
    const expense = await prisma.expense.create({
      data: {
        description: input.description,
        amount: input.amount,
        date: new Date(input.date),
        category: input.category || null,
        notes: input.notes || null,
        userId: session.user.id,
      },
    });
    revalidatePath("/ausgaben");
    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Create expense error:", error);
    return { error: "Ausgabe konnte nicht erstellt werden." };
  }
}

export async function updateExpense(id: string, input: ExpenseInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  try {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Ausgabe nicht gefunden oder keine Berechtigung." };
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description: input.description,
        amount: input.amount,
        date: new Date(input.date),
        category: input.category || null,
        notes: input.notes || null,
      },
    });
    revalidatePath("/ausgaben");
    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Update expense error:", error);
    return { error: "Ausgabe konnte nicht aktualisiert werden." };
  }
}

export async function deleteExpense(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  try {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Ausgabe nicht gefunden oder keine Berechtigung." };
    }

    await prisma.expense.delete({ where: { id } });
    revalidatePath("/ausgaben");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete expense error:", error);
    return { error: "Ausgabe konnte nicht gelöscht werden." };
  }
}

export async function getExpensesByDateRange(userId: string, startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    orderBy: { date: "desc" },
  });

  return expenses;
}

export async function getTotalExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<number> {
  const expenses = await getExpensesByDateRange(userId, startDate, endDate);
  return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
}
