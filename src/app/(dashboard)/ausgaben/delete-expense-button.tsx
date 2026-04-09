"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteExpense } from "@/lib/actions/expenses";

interface DeleteExpenseButtonProps {
  id: string;
  description: string;
}

export function DeleteExpenseButton({ id, description }: DeleteExpenseButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm(`Ausgabe "${description}" wirklich löschen?`)) return;
    setLoading(true);
    try {
      const result = await deleteExpense(id);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gelöscht", description: "Ausgabe wurde gelöscht." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading} className="text-destructive hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
