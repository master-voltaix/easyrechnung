"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateInvoiceStatus } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

interface Props {
  id: string;
  currentStatus: string;
}

export function MarkAsPaidButton({ id, currentStatus }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);

  if (currentStatus === "PAID" || currentStatus === "CANCELLED") return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const date = paidDate ? new Date(paidDate + "T00:00:00") : new Date();
      const result = await updateInvoiceStatus(id, "PAID", date);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Als bezahlt markiert", description: `Bezahldatum: ${new Date(paidDate).toLocaleDateString("de-DE")}` });
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Als bezahlt markieren" className="text-green-600 hover:text-green-700 hover:bg-green-50">
          <CheckCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">Als bezahlt markieren</p>
          <div className="space-y-1">
            <Label htmlFor={`paid-date-${id}`} className="text-xs text-muted-foreground">Bezahldatum</Label>
            <Input
              id={`paid-date-${id}`}
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleConfirm} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Bestätigen"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
