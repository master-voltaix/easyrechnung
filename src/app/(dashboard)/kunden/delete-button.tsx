"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { deleteCustomer } from "@/lib/actions/customers";
import { useRouter } from "next/navigation";

interface DeleteCustomerButtonProps {
  id: string;
  name: string;
}

export function DeleteCustomerButton({ id, name }: DeleteCustomerButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Möchten Sie den Kunden "${name}" wirklich löschen?`)) return;

    setLoading(true);
    try {
      const result = await deleteCustomer(id);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gelöscht", description: "Kunde wurde erfolgreich gelöscht." });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
