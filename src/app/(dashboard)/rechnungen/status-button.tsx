"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { updateInvoiceStatus } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

interface InvoiceStatusButtonProps {
  id: string;
  currentStatus: InvoiceStatus;
}

const nextStatusMap: Partial<Record<InvoiceStatus, InvoiceStatus>> = {
  DRAFT: "SENT",
  SENT: "PAID",
};

const nextStatusLabel: Partial<Record<InvoiceStatus, string>> = {
  DRAFT: "Als versendet markieren",
  SENT: "Als bezahlt markieren",
};

export function InvoiceStatusButton({ id, currentStatus }: InvoiceStatusButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextStatus = nextStatusMap[currentStatus];
  if (!nextStatus) return null;

  const handleStatusChange = async () => {
    setLoading(true);
    try {
      const result = await updateInvoiceStatus(id, nextStatus);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Status aktualisiert", description: `Rechnung wurde als "${nextStatusLabel[currentStatus]?.replace("Als ", "").replace(" markieren", "")}" markiert.` });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleStatusChange}
      disabled={loading}
      title={nextStatusLabel[currentStatus]}
    >
      <RefreshCw className="h-4 w-4 text-blue-500" />
    </Button>
  );
}
