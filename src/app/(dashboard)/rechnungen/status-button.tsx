"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { updateInvoiceStatus, updateInvoicePaidDate } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

interface MarkAsPaidButtonProps {
  id: string;
  currentStatus: string;
}

export function MarkAsPaidButton({ id, currentStatus }: MarkAsPaidButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (currentStatus === "PAID" || currentStatus === "CANCELLED") return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const paidDate = new Date(date + "T00:00:00");
      const r1 = await updateInvoicePaidDate(id, paidDate);
      if (r1.error) {
        toast({ title: "Fehler", description: r1.error, variant: "destructive" });
        return;
      }
      const r2 = await updateInvoiceStatus(id, "PAID");
      if (r2.error) {
        toast({ title: "Fehler", description: r2.error, variant: "destructive" });
        return;
      }
      toast({ title: "Als bezahlt markiert" });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Als bezahlt markieren">
          <CheckCircle className="h-4 w-4 text-[#52B876]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">Als bezahlt markieren</p>
          <div className="space-y-1">
            <Label htmlFor={`paid-date-${id}`} className="text-xs text-muted-foreground">
              Bezahlt am
            </Label>
            <Input
              id={`paid-date-${id}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8" onClick={handleConfirm} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Bestätigen"}
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
