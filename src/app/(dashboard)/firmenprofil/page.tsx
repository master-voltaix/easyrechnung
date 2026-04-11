import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FirmenprofilForm } from "./firmenprofil-form";
import { getServerLanguage } from "@/lib/get-server-language";

export default async function FirmenprofilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { t } = getServerLanguage();

  const profile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.companyProfile.title}</h1>
        <p className="text-muted-foreground mt-1">{t.companyProfile.subtitle}</p>
      </div>
      <FirmenprofilForm initialProfile={profile} />
    </div>
  );
}
