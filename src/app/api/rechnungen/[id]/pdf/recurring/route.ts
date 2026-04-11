import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHtml, type InvoiceData } from "@/components/invoice-pdf-template";
import { generateModernInvoiceHtml } from "@/components/invoice-pdf-template-modern";
import { getUserTemplateSettings } from "@/lib/actions/templates";
import { launchBrowser } from "@/lib/browser";
import { loadLogoAsBase64 } from "@/lib/logo";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Nicht authentifiziert", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!fromStr || !toStr) {
    return new NextResponse("Parameter 'from' und 'to' erforderlich", { status: 400 });
  }

  const fromDate = new Date(fromStr + "T00:00:00");
  const toDate = new Date(toStr + "T00:00:00");

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return new NextResponse("Ungültiges Datum", { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!invoice || invoice.userId !== session.user.id) {
      return new NextResponse("Nicht gefunden", { status: 404 });
    }

    if (invoice.recurringType === "NONE") {
      return new NextResponse("Diese Rechnung ist nicht wiederkehrend", { status: 400 });
    }

    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Get template settings
    const templateKey = invoice.templateKey ?? "classic";
    const settings = await getUserTemplateSettings(session.user.id, templateKey);

    // Calculate vat groups
    const vatGroupMap = new Map<number, number>();
    for (const item of invoice.items) {
      const rate = Number(item.vatRate);
      const net = Number(item.lineTotalNet);
      const vat = net * (rate / 100);
      vatGroupMap.set(rate, (vatGroupMap.get(rate) ?? 0) + vat);
    }
    const vatGroups = Array.from(vatGroupMap.entries()).map(([rate, amount]) => ({ rate, amount }));

    // Load logo as base64
    const logo = company?.logoUrl ? await loadLogoAsBase64(company.logoUrl) : null;
    const logoBase64 = logo?.logoBase64 ?? null;
    const logoMimeType = logo?.logoMimeType ?? null;

    // Build period label for the service date field
    const isSameDay = fromStr === toStr;
    let periodLabel: string;
    if (isSameDay) {
      periodLabel = formatDate(fromDate);
    } else {
      periodLabel = `${formatDate(fromDate)} – ${formatDate(toDate)}`;
    }

    // Use fromDate as issue date; use period as serviceDate display
    const paymentDays = invoice.dueDate
      ? Math.ceil(
          (invoice.dueDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: formatDate(fromDate),
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : null,
      serviceDate: periodLabel,
      customNote: invoice.customNote,
      paymentDays,
      customer: {
        companyName: invoice.customer.companyName,
        contactPerson: invoice.customer.contactPerson,
        street: invoice.customer.street,
        postalCode: invoice.customer.postalCode,
        city: invoice.customer.city,
        vatId: invoice.customer.vatId,
      },
      company: {
        companyName: company?.companyName ?? "",
        ownerName: company?.ownerName,
        street: company?.street,
        postalCode: company?.postalCode,
        city: company?.city,
        phone: company?.phone,
        email: company?.email,
        website: company?.website,
        vatId: company?.vatId,
        taxNumber: company?.taxNumber,
        iban: company?.iban,
        bic: company?.bic,
        bankName: company?.bankName,
        accountHolder: company?.accountHolder,
        logoBase64,
        logoMimeType,
      },
      items: invoice.items.map((item) => ({
        title: item.title,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
        lineTotalNet: Number(item.lineTotalNet),
      })),
      subtotalNet: Number(invoice.subtotalNet),
      totalVat: Number(invoice.totalVat),
      totalGross: Number(invoice.totalGross),
      vatGroups,
    };

    const html =
      templateKey === "modern"
        ? generateModernInvoiceHtml(invoiceData, settings)
        : generateInvoiceHtml(invoiceData, settings);

    const browser = await launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", bottom: "0", left: "0", right: "0" },
      });

      const suffix = isSameDay ? fromStr : `${fromStr}_${toStr}`;
      const filename = `Rechnung-${invoice.invoiceNumber}_${suffix}.pdf`;

      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Recurring PDF generation error:", error);
    return new NextResponse("PDF-Generierung fehlgeschlagen", { status: 500 });
  }
}
