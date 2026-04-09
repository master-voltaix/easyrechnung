"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEuro, formatDate } from "@/lib/utils";
import { ExpenseForm } from "./expense-form";
import { DeleteExpenseButton } from "./delete-expense-button";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string | null;
  notes: string | null;
}

interface ExpensesClientProps {
  expenses: Expense[];
  totalAmount: number;
}

export function ExpensesClient({ expenses, totalAmount }: ExpensesClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditExpense(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ausgaben</h1>
          <p className="text-gray-600 mt-1">
            {expenses.length} Einträge · Gesamt: <span className="font-semibold text-foreground">{formatEuro(totalAmount)}</span>
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Ausgabe
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">Noch keine Ausgaben erfasst.</p>
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Ausgabe anlegen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category ?? "-"}</TableCell>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatEuro(expense.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteExpenseButton id={expense.id} description={expense.description} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExpenseForm open={formOpen} onClose={handleClose} editExpense={editExpense} />
    </>
  );
}
