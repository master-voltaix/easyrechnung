import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CompanyProfilesClient } from "./company-profiles-client";

export default async function FirmenprofilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profiles = await prisma.companyProfile.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Firmenprofile</h1>
        <p className="text-muted-foreground mt-1">
          Verwalte mehrere Firmenprofile – wähle beim Erstellen einer Rechnung welches verwendet wird.
        </p>
      </div>
      <CompanyProfilesClient initialProfiles={profiles} />
    </div>
  );
}
