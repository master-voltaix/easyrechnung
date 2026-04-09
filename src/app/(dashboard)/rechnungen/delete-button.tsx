"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { deleteInvoice } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";

interface DeleteInvoiceButtonProps {
  id: string;
  number: string;
}

export function DeleteInvoiceButton({ id, number }: DeleteInvoiceButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Möchten Sie die Rechnung "${number}" wirklich löschen?`)) return;

    setLoading(true);
    try {
      const result = await deleteInvoice(id);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gelöscht", description: "Rechnung wurde erfolgreich gelöscht." });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading} title="Löschen">
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
