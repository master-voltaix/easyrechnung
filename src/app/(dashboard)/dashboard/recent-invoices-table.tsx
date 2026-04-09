"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { MarkAsPaidButton } from "@/components/mark-as-paid-button";
import { InvoicePdfPreviewButton } from "@/components/invoice-pdf-preview-button";
import { formatEuro, formatDate } from "@/lib/utils";
import { Eye, Download, Pencil } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  totalGross: number;
  status: string;
  customer: { companyName: string };
}

interface Props {
  invoices: Invoice[];
}

export function RecentInvoicesTable({ invoices }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Noch keine Rechnungen vorhanden.</p>
        <Link href="/rechnungen/neu" className="text-blue-600 hover:underline mt-2 inline-block">
          Erste Rechnung erstellen
        </Link>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nummer</TableHead>
          <TableHead>Kunde</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Betrag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <Link href={`/rechnungen/${invoice.id}`} className="text-blue-600 hover:underline font-medium">
                {invoice.invoiceNumber}
              </Link>
            </TableCell>
            <TableCell>{invoice.customer.companyName}</TableCell>
            <TableCell>{formatDate(invoice.issueDate)}</TableCell>
            <TableCell>{formatEuro(invoice.totalGross)}</TableCell>
            <TableCell>
              <StatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <InvoicePdfPreviewButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} iconOnly />
                {invoice.status !== "PAID" && (
                  <Link href={`/rechnungen/${invoice.id}/bearbeiten`}>
                    <Button variant="ghost" size="icon" title="Bearbeiten">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <a href={`/api/rechnungen/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" title="PDF herunterladen">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <MarkAsPaidButton id={invoice.id} currentStatus={invoice.status} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
