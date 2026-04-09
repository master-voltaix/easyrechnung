"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface ProductInput {
  title: string;
  description?: string;
  unitPrice: number;
  vatRate: number;
  unit?: string;
}

export async function createProduct(input: ProductInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const product = await prisma.product.create({
      data: {
        ...input,
        userId: session.user.id,
      },
    });

    revalidatePath("/produkte");
    return { success: true, product };
  } catch (error) {
    console.error("Create product error:", error);
    return { error: "Produkt konnte nicht erstellt werden." };
  }
}

export async function updateProduct(id: string, input: ProductInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Produkt nicht gefunden oder keine Berechtigung." };
    }

    const product = await prisma.product.update({
      where: { id },
      data: input,
    });

    revalidatePath("/produkte");
    revalidatePath(`/produkte/${id}`);
    return { success: true, product };
  } catch (error) {
    console.error("Update product error:", error);
    return { error: "Produkt konnte nicht aktualisiert werden." };
  }
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return { error: "Produkt nicht gefunden oder keine Berechtigung." };
    }

    await prisma.product.delete({ where: { id } });

    revalidatePath("/produkte");
    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return { error: "Produkt konnte nicht gelöscht werden." };
  }
}
