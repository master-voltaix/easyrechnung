"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CompanyProfileInput {
  companyName: string;
  ownerName?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  vatId?: string;
  taxNumber?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  accountHolder?: string;
  defaultInvoiceNote?: string;
  logoUrl?: string;
  accentColor?: string;
}

export async function upsertCompanyProfile(input: CompanyProfileInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert." };
  }

  try {
    await prisma.companyProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...input,
        updatedAt: new Date(),
      },
      create: {
        ...input,
        userId: session.user.id,
      },
    });

    revalidatePath("/firmenprofil");
    return { success: true };
  } catch (error) {
    console.error("Company profile upsert error:", error);
    return { error: "Firmenprofil konnte nicht gespeichert werden." };
  }
}

export async function getCompanyProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  return prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });
}
