"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { RecurringPdfDialog } from "@/components/recurring-pdf-dialog";

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  recurringType: "DAILY" | "WEEKLY" | "MONTHLY";
}

export function RecurringPdfButton({ invoiceId, invoiceNumber, recurringType }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RefreshCw className="h-4 w-4 mr-2" />
        PDF für Zeitraum
      </Button>
      <RecurringPdfDialog
        open={open}
        onClose={() => setOpen(false)}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        recurringType={recurringType}
      />
    </>
  );
}
