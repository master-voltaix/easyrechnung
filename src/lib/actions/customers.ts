"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CustomerInput {
  companyName: string;
  contactPerson?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  email?: string;
  phone?: string;
  vatId?: string;
  notes?: string;
  totalPrice?: number | null;
  textField?: string;
}

export async function createCustomer(input: CustomerInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        companyName: input.companyName,
        contactPerson: input.contactPerson,
        street: input.street,
        postalCode: input.postalCode,
        city: input.city,
        email: input.email,
        phone: input.phone,
        vatId: input.vatId,
        notes: input.notes,
        totalPrice: input.totalPrice ?? null,
        textField: input.textField,
        userId: session.user.id,
      },
    });

    revalidatePath("/kunden");
    return { success: true, customer };
  } catch (error) {
    console.error("Create customer error:", error);
    return { error: "Kunde konnte nicht erstellt werden." };
  }
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Kunde nicht gefunden oder keine Berechtigung." };
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        companyName: input.companyName,
        contactPerson: input.contactPerson,
        street: input.street,
        postalCode: input.postalCode,
        city: input.city,
        email: input.email,
        phone: input.phone,
        vatId: input.vatId,
        notes: input.notes,
        totalPrice: input.totalPrice ?? null,
        textField: input.textField,
      },
    });

    revalidatePath("/kunden");
    revalidatePath(`/kunden/${id}`);
    return { success: true, customer };
  } catch (error) {
    console.error("Update customer error:", error);
    return { error: "Kunde konnte nicht aktualisiert werden." };
  }
}

export async function deleteCustomer(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Kunde nicht gefunden oder keine Berechtigung." };
    }

    await prisma.customer.delete({ where: { id } });

    revalidatePath("/kunden");
    return { success: true };
  } catch (error) {
    console.error("Delete customer error:", error);
    return { error: "Kunde konnte nicht gelöscht werden." };
  }
}
