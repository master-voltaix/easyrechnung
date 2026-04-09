import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FirmenprofilForm } from "./firmenprofil-form";

export default async function FirmenprofilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Firmenprofil</h1>
        <p className="text-gray-600 mt-1">Verwalten Sie Ihre Firmendaten für Rechnungen.</p>
      </div>
      <FirmenprofilForm initialProfile={profile} />
    </div>
  );
}
