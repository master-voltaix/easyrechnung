"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type InvoiceStatus = "DRAFT" | "PAID" | "CANCELLED";

interface InvoiceItemInput {
  productId?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  sortOrder?: number;
}

type RecurringType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

interface CreateInvoiceInput {
  customerId: string;
  issueDate: Date;
  dueDate?: Date;
  serviceDate?: Date;
  customNote?: string;
  internalNote?: string;
  recurringType?: RecurringType;
  templateKey?: string;
  items: InvoiceItemInput[];
}

interface UpdateInvoiceInput extends CreateInvoiceInput {
  status?: InvoiceStatus;
  templateKey?: string;
}

function calculateTotals(items: InvoiceItemInput[]) {
  let subtotalNet = 0;
  let totalVat = 0;

  const calculatedItems = items.map((item, index) => {
    const lineTotalNet = item.quantity * item.unitPrice;
    const lineVat = lineTotalNet * (item.vatRate / 100);
    subtotalNet += lineTotalNet;
    totalVat += lineVat;

    return {
      ...item,
      lineTotalNet,
      sortOrder: item.sortOrder ?? index,
    };
  });

  const totalGross = subtotalNet + totalVat;
  return { calculatedItems, subtotalNet, totalVat, totalGross };
}

async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      userId,
      invoiceNumber: { startsWith: `RE-${year}-` },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `RE-${year}-${seq}`;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    // Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer || customer.userId !== session.user.id) {
      return { error: "Kunde nicht gefunden." };
    }

    const invoiceNumber = await generateInvoiceNumber(session.user.id);
    const { calculatedItems, subtotalNet, totalVat, totalGross } =
      calculateTotals(input.items);

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        customerId: input.customerId,
        invoiceNumber,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        serviceDate: input.serviceDate,
        subtotalNet,
        totalVat,
        totalGross,
        customNote: input.customNote,
        internalNote: input.internalNote,
        recurringType: input.recurringType ?? "NONE",
        templateKey: input.templateKey ?? "classic",
        status: "DRAFT",
        items: {
          create: calculatedItems.map((item) => ({
            productId: item.productId,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            lineTotalNet: item.lineTotalNet,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    revalidatePath("/rechnungen");
    revalidatePath("/dashboard");
    return { success: true, invoice };
  } catch (error) {
    console.error("Create invoice error:", error);
    return { error: "Rechnung konnte nicht erstellt werden." };
  }
}

export async function updateInvoice(id: string, input: UpdateInvoiceInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Rechnung nicht gefunden oder keine Berechtigung." };
    }

    // Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer || customer.userId !== session.user.id) {
      return { error: "Kunde nicht gefunden." };
    }

    const { calculatedItems, subtotalNet, totalVat, totalGross } =
      calculateTotals(input.items);

    // Delete old items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerId: input.customerId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        serviceDate: input.serviceDate,
        subtotalNet,
        totalVat,
        totalGross,
        customNote: input.customNote,
        internalNote: input.internalNote,
        recurringType: input.recurringType ?? existing.recurringType,
        templateKey: input.templateKey ?? existing.templateKey,
        status: input.status ?? existing.status,
        items: {
          create: calculatedItems.map((item) => ({
            productId: item.productId,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            lineTotalNet: item.lineTotalNet,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    revalidatePath("/rechnungen");
    revalidatePath(`/rechnungen/${id}`);
    revalidatePath("/dashboard");
    return { success: true, invoice };
  } catch (error) {
    console.error("Update invoice error:", error);
    return { error: "Rechnung konnte nicht aktualisiert werden." };
  }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus, paidDate?: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Rechnung nicht gefunden oder keine Berechtigung." };
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === "PAID" && paidDate ? { paidDate } : {}),
      },
    });

    revalidatePath("/rechnungen");
    revalidatePath(`/rechnungen/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update invoice status error:", error);
    return { error: "Status konnte nicht aktualisiert werden." };
  }
}

export async function updateInvoicePaidDate(id: string, paidDate: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Rechnung nicht gefunden oder keine Berechtigung." };
    }

    await prisma.invoice.update({
      where: { id },
      data: { paidDate },
    });

    revalidatePath("/rechnungen");
    revalidatePath(`/rechnungen/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update invoice paid date error:", error);
    return { error: "Bezahldatum konnte nicht aktualisiert werden." };
  }
}

export async function deleteInvoice(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Rechnung nicht gefunden oder keine Berechtigung." };
    }

    await prisma.invoice.delete({ where: { id } });

    revalidatePath("/rechnungen");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete invoice error:", error);
    return { error: "Rechnung konnte nicht gelöscht werden." };
  }
}
