"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { MarkAsPaidButton } from "@/components/mark-as-paid-button";
import { InvoicePdfPreviewButton } from "@/components/invoice-pdf-preview-button";
import { formatEuro, formatDate } from "@/lib/utils";
import { Download, Pencil } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { DeleteInvoiceButton } from "@/app/(dashboard)/rechnungen/delete-button";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  totalGross: number;
  status: string;
  customer: { companyName: string };
}

export function RecentInvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const { t } = useLanguage();

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t.invoices.noInvoices}</p>
        <Link href="/rechnungen/neu" className="text-primary hover:underline mt-2 inline-block text-sm font-medium">
          {t.invoices.createFirst}
        </Link>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.invoices.number}</TableHead>
          <TableHead>{t.invoices.customer}</TableHead>
          <TableHead>{t.invoices.date}</TableHead>
          <TableHead>{t.invoices.amount}</TableHead>
          <TableHead>{t.invoices.status}</TableHead>
          <TableHead className="text-right">{t.invoices.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <Link href={`/rechnungen/${invoice.id}`} className="text-primary hover:underline font-medium font-mono text-sm">
                {invoice.invoiceNumber}
              </Link>
            </TableCell>
            <TableCell>{invoice.customer.companyName}</TableCell>
            <TableCell className="font-mono text-sm">{formatDate(invoice.issueDate)}</TableCell>
            <TableCell className="font-mono text-sm">{formatEuro(invoice.totalGross)}</TableCell>
            <TableCell>
              <StatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <InvoicePdfPreviewButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} iconOnly />
                <Link href={`/rechnungen/${invoice.id}/bearbeiten`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t.invoices.edit}
                    disabled={invoice.status === "PAID"}
                    className={invoice.status !== "PAID" ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : ""}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <a href={`/api/rechnungen/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" title={t.invoices.downloadPdf}>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <MarkAsPaidButton id={invoice.id} currentStatus={invoice.status} />
                <DeleteInvoiceButton id={invoice.id} number={invoice.invoiceNumber} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
