"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TemplateSettings, getDefaults } from "@/lib/template-settings";

// NOT a server action — helper for other server-side code
export async function getUserTemplateSettings(userId: string, key: string): Promise<TemplateSettings> {
  try {
    const template = await prisma.invoiceTemplate.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (!template) return getDefaults(key);
    const stored = JSON.parse(template.settings) as Partial<TemplateSettings>;
    return { ...getDefaults(key), ...stored };
  } catch {
    return getDefaults(key);
  }
}

export async function saveTemplateSettings(
  key: string,
  settings: TemplateSettings
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Nicht authentifiziert" };
  const name = key === "modern" ? "Modern" : "Klassisch";
  try {
    await prisma.invoiceTemplate.upsert({
      where: { userId_key: { userId: session.user.id, key } },
      create: {
        userId: session.user.id,
        key,
        name,
        settings: JSON.stringify(settings),
      },
      update: { settings: JSON.stringify(settings) },
    });
    revalidatePath("/vorlagen");
    return {};
  } catch {
    return { error: "Einstellungen konnten nicht gespeichert werden." };
  }
}

export async function getTemplatesForPage(): Promise<{
  classic: TemplateSettings;
  modern: TemplateSettings;
} | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const [classic, modern] = await Promise.all([
    getUserTemplateSettings(session.user.id, "classic"),
    getUserTemplateSettings(session.user.id, "modern"),
  ]);
  return { classic, modern };
}
