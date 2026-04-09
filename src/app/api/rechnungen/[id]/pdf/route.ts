import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHtml, type InvoiceData } from "@/components/invoice-pdf-template";
import { readFile } from "fs/promises";
import path from "path";

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

    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
    });

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
    let logoBase64: string | null = null;
    let logoMimeType: string | null = null;
    if (company?.logoUrl) {
      try {
        const logoPath = path.join(process.cwd(), "public", company.logoUrl);
        const logoBuffer = await readFile(logoPath);
        logoBase64 = logoBuffer.toString("base64");
        const ext = company.logoUrl.split(".").pop()?.toLowerCase();
        logoMimeType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
      } catch {
        // Logo not found, skip
      }
    }

    // Calculate payment days
    let paymentDays: number | null = null;
    if (invoice.dueDate) {
      paymentDays = Math.ceil(
        (invoice.dueDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: formatDate(invoice.issueDate),
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : null,
      serviceDate: invoice.serviceDate ? formatDate(invoice.serviceDate) : null,
      customNote: invoice.customNote,
      paymentDays,
      accentColor: company?.accentColor ?? "#1f2937",
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

    const html = generateInvoiceHtml(invoiceData);

    // Use puppeteer to generate PDF
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", bottom: "0", left: "0", right: "0" },
      });

      const inline = request.nextUrl.searchParams.get("inline") === "true";
      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": inline
            ? `inline; filename="Rechnung-${invoice.invoiceNumber}.pdf"`
            : `attachment; filename="Rechnung-${invoice.invoiceNumber}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("PDF-Generierung fehlgeschlagen", { status: 500 });
  }
}
