"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Copy, Plus, RefreshCw, Eye, Pencil } from "lucide-react";
import { formatEuro, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { DeleteInvoiceButton } from "./delete-button";
import { MarkAsPaidButton } from "./status-button";
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
  const [recurringDialog, setRecurringDialog] = useState<{ id: string; number: string; type: "DAILY" | "WEEKLY" | "MONTHLY"; issueDate: Date } | null>(null);

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
                      {/* Eye: view */}
                      <Link href={`/rechnungen/${invoice.id}`} title="Anzeigen">
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Edit */}
                      <Link href={`/rechnungen/${invoice.id}/bearbeiten`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Bearbeiten"
                          disabled={invoice.status === "PAID"}
                          className={invoice.status !== "PAID" ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : ""}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Download PDF */}
                      {invoice.recurringType !== "NONE" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Wiederkehrende PDF herunterladen"
                          onClick={() => setRecurringDialog({ id: invoice.id, number: invoice.invoiceNumber, type: invoice.recurringType as "DAILY" | "WEEKLY" | "MONTHLY", issueDate: invoice.issueDate })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <a href={`/api/rechnungen/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" title="PDF herunterladen">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}

                      {/* XML download */}
                      <a href={`/api/rechnungen/${invoice.id}/xrechnung`} target="_blank" rel="noopener noreferrer" title="XRechnung herunterladen">
                        <Button variant="ghost" size="sm" className="text-xs font-mono">XML</Button>
                      </a>

                      {/* Copy */}
                      <Link href={`/rechnungen/neu?copy=${invoice.id}`} title="Kopieren">
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Mark as paid */}
                      <MarkAsPaidButton id={invoice.id} currentStatus={invoice.status} />

                      {/* Delete */}
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
        issueDate={recurringDialog.issueDate}
      />
    )}
  </>
  );
}
