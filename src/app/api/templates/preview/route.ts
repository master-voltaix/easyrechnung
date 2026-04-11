import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TemplateSettings, getDefaults } from "@/lib/template-settings";
import { generateInvoiceHtml, type InvoiceData } from "@/components/invoice-pdf-template";
import { generateModernInvoiceHtml } from "@/components/invoice-pdf-template-modern";
import { loadLogoAsBase64 } from "@/lib/logo";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Nicht authentifiziert", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const key = searchParams.get("key") ?? "classic";
  const sParam = searchParams.get("s");

  let settings: TemplateSettings = getDefaults(key);
  if (sParam) {
    try {
      const decoded = decodeURIComponent(escape(atob(sParam)));
      const parsed = JSON.parse(decoded) as Partial<TemplateSettings>;
      settings = { ...getDefaults(key), ...parsed };
    } catch {
      // Use defaults on parse error
    }
  }

  // Load company profile for real data
  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });

  // Load logo as base64
  const logo = company?.logoUrl ? await loadLogoAsBase64(company.logoUrl) : null;
  const logoBase64 = logo?.logoBase64 ?? null;
  const logoMimeType = logo?.logoMimeType ?? null;

  // Sample invoice data
  const invoiceData: InvoiceData = {
    invoiceNumber: "RE-2026-0001",
    issueDate: "10.04.2026",
    dueDate: "24.04.2026",
    serviceDate: "01.04.2026 – 30.04.2026",
    customNote: null,
    paymentDays: 14,
    customer: {
      companyName: "Muster GmbH",
      contactPerson: "Max Mustermann",
      street: "Musterstraße 12",
      postalCode: "10115",
      city: "Berlin",
      vatId: "DE123456789",
    },
    company: {
      companyName: company?.companyName ?? "Ihre Firma GmbH",
      ownerName: company?.ownerName ?? null,
      street: company?.street ?? "Beispielstraße 1",
      postalCode: company?.postalCode ?? "80331",
      city: company?.city ?? "München",
      phone: company?.phone ?? null,
      email: company?.email ?? null,
      website: company?.website ?? null,
      vatId: company?.vatId ?? null,
      taxNumber: company?.taxNumber ?? null,
      iban: company?.iban ?? "DE89 3704 0044 0532 0130 00",
      bic: company?.bic ?? "COBADEFFXXX",
      bankName: company?.bankName ?? null,
      accountHolder: company?.accountHolder ?? null,
      logoBase64,
      logoMimeType,
    },
    items: [
      {
        title: "Webdesign & Development",
        description: "Responsive Website mit CMS-Anbindung",
        quantity: 1,
        unit: "Pauschal",
        unitPrice: 2000,
        vatRate: 19,
        lineTotalNet: 2000,
      },
      {
        title: "SEO-Optimierung",
        description: "On-Page Analyse und Umsetzung",
        quantity: 3,
        unit: "Std.",
        unitPrice: 120,
        vatRate: 19,
        lineTotalNet: 360,
      },
    ],
    subtotalNet: 2360,
    totalVat: 448.4,
    totalGross: 2808.4,
    vatGroups: [{ rate: 19, amount: 448.4 }],
  };

  const html =
    key === "modern"
      ? generateModernInvoiceHtml(invoiceData, settings)
      : generateInvoiceHtml(invoiceData, settings);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
