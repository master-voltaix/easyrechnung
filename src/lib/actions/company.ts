"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CompanyProfileInput {
  profileName?: string;
  isDefault?: boolean;
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

/** Legacy upsert — keeps backward compat with existing form */
export async function upsertCompanyProfile(input: CompanyProfileInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  try {
    // Find the default/first profile for this user
    const existing = await prisma.companyProfile.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      await prisma.companyProfile.update({
        where: { id: existing.id },
        data: { ...input, updatedAt: new Date() },
      });
    } else {
      await prisma.companyProfile.create({
        data: {
          ...input,
          profileName: input.profileName ?? "Hauptfirma",
          isDefault: true,
          userId: session.user.id,
        },
      });
    }

    revalidatePath("/firmenprofil");
    return { success: true };
  } catch (error) {
    console.error("Company profile upsert error:", error);
    return { error: "Firmenprofil konnte nicht gespeichert werden." };
  }
}

/** Get all company profiles for the current user */
export async function getCompanyProfiles() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  return prisma.companyProfile.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

/** Get single company profile by id (must belong to user) */
export async function getCompanyProfile(id?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  if (id) {
    const profile = await prisma.companyProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== session.user.id) return null;
    return profile;
  }

  // No id → return default or first
  return prisma.companyProfile.findFirst({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

/** Create a new company profile */
export async function createCompanyProfile(input: CompanyProfileInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  try {
    const count = await prisma.companyProfile.count({ where: { userId: session.user.id } });
    const isDefault = count === 0;

    const profile = await prisma.companyProfile.create({
      data: {
        ...input,
        profileName: input.profileName ?? "Neues Profil",
        isDefault,
        userId: session.user.id,
      },
    });

    revalidatePath("/firmenprofil");
    return { success: true, id: profile.id };
  } catch (error) {
    console.error("Create company profile error:", error);
    return { error: "Profil konnte nicht erstellt werden." };
  }
}

/** Update an existing company profile */
export async function updateCompanyProfile(id: string, input: CompanyProfileInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  const existing = await prisma.companyProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return { error: "Nicht gefunden." };

  try {
    await prisma.companyProfile.update({
      where: { id },
      data: { ...input, updatedAt: new Date() },
    });

    revalidatePath("/firmenprofil");
    return { success: true };
  } catch (error) {
    console.error("Update company profile error:", error);
    return { error: "Profil konnte nicht gespeichert werden." };
  }
}

/** Delete a company profile */
export async function deleteCompanyProfile(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  const existing = await prisma.companyProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return { error: "Nicht gefunden." };

  try {
    await prisma.companyProfile.delete({ where: { id } });
    // If it was default, promote next oldest
    if (existing.isDefault) {
      const next = await prisma.companyProfile.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
      if (next) await prisma.companyProfile.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    revalidatePath("/firmenprofil");
    return { success: true };
  } catch (error) {
    console.error("Delete company profile error:", error);
    return { error: "Profil konnte nicht gelöscht werden." };
  }
}

/** Set a profile as default */
export async function setDefaultCompanyProfile(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert." };

  const profile = await prisma.companyProfile.findUnique({ where: { id } });
  if (!profile || profile.userId !== session.user.id) return { error: "Nicht gefunden." };

  try {
    // Unset all defaults, then set this one
    await prisma.companyProfile.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
    await prisma.companyProfile.update({ where: { id }, data: { isDefault: true } });

    revalidatePath("/firmenprofil");
    return { success: true };
  } catch (error) {
    console.error("Set default error:", error);
    return { error: "Standard konnte nicht gesetzt werden." };
  }
}
