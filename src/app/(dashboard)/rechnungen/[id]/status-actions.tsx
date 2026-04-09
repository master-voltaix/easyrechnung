"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateInvoiceStatus, updateInvoicePaidDate } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

interface InvoiceStatusActionsProps {
  id: string;
  currentStatus: InvoiceStatus;
  paidDate?: Date | null;
}

export function InvoiceStatusActions({ id, currentStatus, paidDate }: InvoiceStatusActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPaidDateInput, setShowPaidDateInput] = useState(false);
  const [selectedPaidDate, setSelectedPaidDate] = useState<string>(
    paidDate ? new Date(paidDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setLoading(true);
    try {
      const result = await updateInvoiceStatus(id, newStatus);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Status aktualisiert" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      // Use the input date string directly (YYYY-MM-DD format)
      // Convert to Date at midnight local time, then to ISO string
      const date = new Date(selectedPaidDate + "T00:00:00");

      // First update the paid date
      const paidDateResult = await updateInvoicePaidDate(id, date);
      if (paidDateResult.error) {
        toast({ title: "Fehler", description: paidDateResult.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Then update the status (only if not already paid)
      if (!isPaid) {
        const statusResult = await updateInvoiceStatus(id, "PAID");
        if (statusResult.error) {
          toast({ title: "Fehler", description: statusResult.error, variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      toast({ title: isPaid ? "Bezahlt-Datum aktualisiert" : "Rechnung als bezahlt markiert" });
      setShowPaidDateInput(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  // Show edit paid date button even for PAID invoices
  if (currentStatus === "CANCELLED") return null;

  const isPaid = currentStatus === "PAID";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isPaid ? "Bezahlt-Datum" : "Status ändern"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {!isPaid && (
            <>
              {currentStatus === "DRAFT" && (
                <Button onClick={() => handleStatusChange("SENT")} disabled={loading} variant="outline">
                  Als versendet markieren
                </Button>
              )}
              {(currentStatus === "DRAFT" || currentStatus === "SENT") && (
                <Button
                  onClick={() => setShowPaidDateInput(!showPaidDateInput)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Als bezahlt markieren
                </Button>
              )}
              <Button onClick={() => handleStatusChange("CANCELLED")} disabled={loading} variant="destructive">
                Stornieren
              </Button>
            </>
          )}
          {isPaid && (
            <Button
              onClick={() => setShowPaidDateInput(!showPaidDateInput)}
              disabled={loading}
              variant="outline"
            >
              Bezahlt-Datum bearbeiten
            </Button>
          )}
        </div>

        {showPaidDateInput && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor="paidDate">Bezahlt am</Label>
              <Input
                id="paidDate"
                type="date"
                value={selectedPaidDate}
                onChange={(e) => setSelectedPaidDate(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Wählen Sie das Datum, an dem die Rechnung bezahlt wurde.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleMarkAsPaid} disabled={loading} className="bg-green-600 hover:bg-green-700">
                Bestätigen
              </Button>
              <Button onClick={() => setShowPaidDateInput(false)} disabled={loading} variant="outline">
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
