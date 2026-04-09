"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Copy, Plus, RefreshCw } from "lucide-react";
import { formatEuro, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { DeleteInvoiceButton } from "./delete-button";
import { InvoiceStatusButton } from "./status-button";
import { InvoicePdfPreviewButton } from "@/components/invoice-pdf-preview-button";
import { RecurringPdfDialog } from "@/components/recurring-pdf-dialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date | null;
  totalGross: number;
  status: string;
  recurringType: string;
  customer: { companyName: string };
}

interface Props {
  invoices: Invoice[];
}

export function RechnungenClient({ invoices }: Props) {
  const [recurringDialog, setRecurringDialog] = useState<{ id: string; number: string; type: "DAILY" | "WEEKLY" | "MONTHLY" } | null>(null);

  return (
    <>
    <Card>
      <CardContent className="p-0">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Noch keine Rechnungen erstellt.</p>
            <Link href="/rechnungen/neu">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Erste Rechnung erstellen
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nummer</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Fälligkeit</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customer.companyName}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</TableCell>
                  <TableCell>{formatEuro(invoice.totalGross)}</TableCell>
                  <TableCell><StatusBadge status={invoice.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <InvoicePdfPreviewButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} iconOnly />
                      {invoice.recurringType !== "NONE" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Wiederkehrende PDF herunterladen"
                          onClick={() => setRecurringDialog({ id: invoice.id, number: invoice.invoiceNumber, type: invoice.recurringType as "DAILY" | "WEEKLY" | "MONTHLY" })}
                        >
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                        </Button>
                      ) : (
                        <a href={`/api/rechnungen/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" title="PDF herunterladen">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <a href={`/api/rechnungen/${invoice.id}/xrechnung`} target="_blank" rel="noopener noreferrer" title="XRechnung herunterladen">
                        <Button variant="ghost" size="sm" className="text-xs">XML</Button>
                      </a>
                      <Link href={`/rechnungen/neu?copy=${invoice.id}`} title="Kopieren">
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </Link>
                      <InvoiceStatusButton id={invoice.id} currentStatus={invoice.status as "DRAFT" | "SENT" | "PAID" | "CANCELLED"} />
                      <DeleteInvoiceButton id={invoice.id} number={invoice.invoiceNumber} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {recurringDialog && (
      <RecurringPdfDialog
        open={true}
        onClose={() => setRecurringDialog(null)}
        invoiceId={recurringDialog.id}
        invoiceNumber={recurringDialog.number}
        recurringType={recurringDialog.type}
      />
    )}
  </>
  );
}
