"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateInvoiceStatus, updateInvoicePaidDate } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type InvoiceStatus = "DRAFT" | "PAID" | "CANCELLED";

interface InvoiceStatusActionsProps {
  id: string;
  currentStatus: InvoiceStatus;
  paidDate?: Date | null;
}

export function InvoiceStatusActions({ id, currentStatus, paidDate }: InvoiceStatusActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    paidDate ? new Date(paidDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  if (currentStatus === "CANCELLED") return null;

  const isPaid = currentStatus === "PAID";

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const r1 = await updateInvoicePaidDate(id, date);
      if (r1.error) {
        toast({ title: "Fehler", description: r1.error, variant: "destructive" });
        return;
      }
      if (!isPaid) {
        const r2 = await updateInvoiceStatus(id, "PAID");
        if (r2.error) {
          toast({ title: "Fehler", description: r2.error, variant: "destructive" });
          return;
        }
      }
      toast({ title: isPaid ? "Bezahlt-Datum aktualisiert" : "Rechnung als bezahlt markiert" });
      setShowDateInput(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const result = await updateInvoiceStatus(id, "CANCELLED");
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Rechnung storniert" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border bg-card p-4 space-y-3" style={{ borderRadius: "2px" }}>
      <p className="text-sm font-medium text-foreground">
        {isPaid ? "Bezahlt-Datum bearbeiten" : "Als bezahlt markieren"}
      </p>

      {!showDateInput ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowDateInput(true)}
            disabled={loading}
            size="sm"
            className={isPaid ? "" : "bg-[#52B876] hover:bg-[#3FA364] text-white"}
            variant={isPaid ? "outline" : "default"}
          >
            {isPaid ? "Datum bearbeiten" : "Als bezahlt markieren"}
          </Button>
          {!isPaid && (
            <Button onClick={handleCancel} disabled={loading} variant="destructive" size="sm">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Stornieren"}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="paidDate" className="text-xs text-muted-foreground">Bezahlt am</Label>
            <Input
              id="paidDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 text-sm max-w-[200px]"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleMarkAsPaid} disabled={loading} className="bg-[#52B876] hover:bg-[#3FA364] text-white">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Bestätigen"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDateInput(false)} disabled={loading}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
