import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserTemplateSettings } from "@/lib/actions/templates";
import { TemplatesClient } from "./templates-client";

export default async function VorlagenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const settings = await getUserTemplateSettings(session.user.id, "classic");

  return (
    <div className="-mt-4 lg:-mt-6 -mx-4 sm:-mx-6 lg:-mx-8 -mb-6">
      <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-border bg-background">
        <h1 className="text-xl font-semibold text-foreground">Rechnungsvorlage</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Passen Sie Ihre Standardvorlage nach Ihren Wünschen an.
        </p>
      </div>
      <TemplatesClient initialSettings={settings} />
    </div>
  );
}
