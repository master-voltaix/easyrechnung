import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateXRechnung } from "@/components/xrechnung-generator";
import type { InvoiceData } from "@/components/invoice-pdf-template";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invoiceId = params.id;
    console.log("[XRechnung] Starting generation for invoice:", invoiceId);

    // Fetch invoice with customer, items, and company profile
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: true,
      },
    });

    console.log("[XRechnung] Invoice fetch result:", invoice ? "found" : "not found");
    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Verify ownership
    if (invoice.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Use invoice's linked company profile, or fall back to default/first
    const company = invoice.companyProfileId
      ? await prisma.companyProfile.findUnique({ where: { id: invoice.companyProfileId } })
      : await prisma.companyProfile.findFirst({
          where: { userId: session.user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

    console.log("[XRechnung] Company profile found:", company ? "yes" : "no");
    if (!company) {
      return new NextResponse("Company profile not configured", { status: 400 });
    }

    // Calculate payment days if dueDate exists
    let paymentDays: number | null = null;
    if (invoice.dueDate) {
      const diffTime = Math.abs(invoice.dueDate.getTime() - invoice.issueDate.getTime());
      paymentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Build invoice data for XRechnung generation
    console.log("[XRechnung] Building invoice data object...");
    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toISOString().split("T")[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split("T")[0] : null,
      serviceDate: invoice.serviceDate
        ? invoice.serviceDate.toISOString().split("T")[0]
        : null,
      customNote: invoice.customNote,
      paymentDays: paymentDays,
      customer: {
        companyName: invoice.customer.companyName,
        contactPerson: invoice.customer.contactPerson,
        street: invoice.customer.street,
        postalCode: invoice.customer.postalCode,
        city: invoice.customer.city,
        vatId: invoice.customer.vatId,
      },
      company: {
        companyName: company.companyName,
        ownerName: company.ownerName,
        street: company.street,
        postalCode: company.postalCode,
        city: company.city,
        phone: company.phone,
        email: company.email,
        website: company.website,
        vatId: company.vatId,
        taxNumber: company.taxNumber,
        iban: company.iban,
        bic: company.bic,
        bankName: company.bankName,
        accountHolder: company.accountHolder,
        logoBase64: null,
        logoMimeType: null,
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
      vatGroups: [],
    };

    // Group VAT by rate
    console.log("[XRechnung] Computing VAT groups...");
    const vatMap = new Map<number, number>();
    invoice.items.forEach((item) => {
      const rate = Number(item.vatRate);
      const amount = Number(item.lineTotalNet) * (rate / 100);
      vatMap.set(rate, (vatMap.get(rate) || 0) + amount);
    });
    invoiceData.vatGroups = Array.from(vatMap, ([rate, amount]) => ({
      rate,
      amount,
    }));
    console.log("[XRechnung] VAT groups computed:", invoiceData.vatGroups);

    // Generate XRechnung XML
    console.log("[XRechnung] Calling generateXRechnung...");
    const xml = generateXRechnung(invoiceData);
    console.log("[XRechnung] XML generated successfully");

    // Return as XML file download
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="Rechnung-${invoice.invoiceNumber}.xml"`,
      },
    });
  } catch (error) {
    console.error("XRechnung generation error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);

    if (error instanceof Error && error.message.includes("Validierungsfehler")) {
      return new NextResponse(error.message, { status: 400 });
    }

    return new NextResponse(`Internal server error: ${errorMessage}`, { status: 500 });
  }
}
