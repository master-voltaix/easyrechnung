"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatEuro } from "@/lib/utils";

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  vatId: string | null;
  notes: string | null;
  totalPrice: number | null;
  textField: string | null;
}

interface CustomerViewModalProps {
  customer: Customer;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function CustomerViewModal({ customer }: CustomerViewModalProps) {
  const [open, setOpen] = useState(false);

  const address = [customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Details anzeigen">
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{customer.companyName}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <DetailRow label="Ansprechpartner" value={customer.contactPerson} />
            <DetailRow label="Adresse" value={address || null} />
            <DetailRow label="E-Mail" value={customer.email} />
            <DetailRow label="Telefon" value={customer.phone} />
            <DetailRow label="USt-ID" value={customer.vatId} />

            {customer.totalPrice !== null && customer.totalPrice !== undefined && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Gesamtpreis</span>
                <span className="text-sm text-foreground font-semibold">{formatEuro(customer.totalPrice)}</span>
              </div>
            )}

            <DetailRow label="Text" value={customer.textField} />
            <DetailRow label="Notizen" value={customer.notes} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
