"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { format } from "date-fns";

const expenseSchema = z.object({
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  date: z.string().min(1, "Datum ist erforderlich"),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  editExpense?: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    category: string | null;
    notes: string | null;
  } | null;
}

export function ExpenseForm({ open, onClose, editExpense }: ExpenseFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: editExpense
      ? {
          description: editExpense.description,
          amount: String(editExpense.amount),
          date: format(new Date(editExpense.date), "yyyy-MM-dd"),
          category: editExpense.category ?? "",
          notes: editExpense.notes ?? "",
        }
      : {
          date: format(new Date(), "yyyy-MM-dd"),
        },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      const amount = parseFloat(data.amount.replace(",", "."));
      if (isNaN(amount) || amount <= 0) {
        toast({ title: "Fehler", description: "Bitte einen gültigen Betrag eingeben.", variant: "destructive" });
        return;
      }

      const input = { description: data.description, amount, date: data.date, category: data.category, notes: data.notes };
      const result = editExpense
        ? await updateExpense(editExpense.id, input)
        : await createExpense(input);

      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gespeichert", description: editExpense ? "Ausgabe aktualisiert." : "Ausgabe angelegt." });
        reset();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editExpense ? "Ausgabe bearbeiten" : "Neue Ausgabe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung *</Label>
            <Input id="description" {...register("description")} placeholder="z.B. Büromaterial" />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag (€) *</Label>
              <Input id="amount" {...register("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Input id="category" {...register("category")} placeholder="z.B. Miete, Fahrtkosten..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea id="notes" {...register("notes")} rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Wird gespeichert..." : editExpense ? "Speichern" : "Ausgabe anlegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
