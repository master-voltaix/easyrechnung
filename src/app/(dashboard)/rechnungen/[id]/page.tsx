import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEuro, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { InvoiceStatusActions } from "./status-actions";
import { InvoicePdfPreviewButton } from "@/components/invoice-pdf-preview-button";
import { RecurringPdfButton } from "./recurring-pdf-button";

export default async function RechnungDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice || invoice.userId !== session.user.id) {
    notFound();
  }

  const dueDays = invoice.dueDate
    ? Math.ceil((invoice.dueDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/rechnungen" className="flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück zu Rechnungen
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <InvoicePdfPreviewButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} variant="outline" />
          {invoice.recurringType !== "NONE" ? (
            <RecurringPdfButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              recurringType={invoice.recurringType as "DAILY" | "WEEKLY" | "MONTHLY"}
              issueDate={invoice.issueDate}
            />
          ) : (
            <a href={`/api/rechnungen/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                PDF herunterladen
              </Button>
            </a>
          )}
          <a href={`/api/rechnungen/${invoice.id}/xrechnung`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              XRechnung herunterladen
            </Button>
          </a>
          {invoice.status !== "PAID" ? (
            <Link href={`/rechnungen/${invoice.id}/bearbeiten`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled title="Bezahlte Rechnungen können nicht bearbeitet werden">
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rechnungsinfo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nummer</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <StatusBadge status={invoice.status} />
            </div>
            {invoice.recurringType !== "NONE" && (
              <div className="flex justify-between">
                <span className="text-gray-600">Rhythmus</span>
                <span className="text-sm font-medium text-blue-600">
                  {invoice.recurringType === "MONTHLY" ? "Monatlich" : invoice.recurringType === "WEEKLY" ? "Wöchentlich" : "Täglich"}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Ausgestellt</span>
              <span>{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Fällig</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.serviceDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Leistungsdatum</span>
                <span>{formatDate(invoice.serviceDate)}</span>
              </div>
            )}
            {invoice.paidDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bezahlt am</span>
                <span className="font-medium text-green-600">{formatDate(invoice.paidDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kunde</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{invoice.customer.companyName}</p>
            {invoice.customer.contactPerson && <p>{invoice.customer.contactPerson}</p>}
            {invoice.customer.street && <p>{invoice.customer.street}</p>}
            {(invoice.customer.postalCode || invoice.customer.city) && (
              <p>{[invoice.customer.postalCode, invoice.customer.city].filter(Boolean).join(" ")}</p>
            )}
            {invoice.customer.email && <p className="text-gray-600">{invoice.customer.email}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nettobetrag</span>
              <span>{formatEuro(Number(invoice.subtotalNet))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MwSt.</span>
              <span>{formatEuro(Number(invoice.totalVat))}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Gesamt</span>
              <span>{formatEuro(Number(invoice.totalGross))}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Positionen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Menge</TableHead>
                <TableHead>Einheit</TableHead>
                <TableHead className="text-right">Preis/Einheit</TableHead>
                <TableHead className="text-right">MwSt. %</TableHead>
                <TableHead className="text-right">Gesamt (inkl. MwSt.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => {
                const net = Number(item.lineTotalNet);
                const vat = net * (Number(item.vatRate) / 100);
                const gross = net + vat;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      {item.description && <div className="text-sm text-gray-500">{item.description}</div>}
                    </TableCell>
                    <TableCell className="text-right">{Number(item.quantity).toLocaleString("de-DE")}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{formatEuro(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{Number(item.vatRate).toFixed(0)} %</TableCell>
                    <TableCell className="text-right font-medium">{formatEuro(gross)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoice.customNote && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Hinweis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.customNote}</p>
          </CardContent>
        </Card>
      )}

      {invoice.internalNote && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Interne Notiz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.internalNote}</p>
          </CardContent>
        </Card>
      )}

      <InvoiceStatusActions
        id={invoice.id}
        currentStatus={invoice.status as "DRAFT" | "PAID" | "CANCELLED"}
        paidDate={invoice.paidDate}
      />
    </div>
  );
}
