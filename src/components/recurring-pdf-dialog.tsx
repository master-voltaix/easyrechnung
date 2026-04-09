"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

interface RecurringPdfDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  recurringType: "DAILY" | "WEEKLY" | "MONTHLY";
}

function getMonthName(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleString("de-DE", { month: "long", year: "numeric" });
}

function getWeekRange(year: number, week: number) {
  // ISO week: find first day of the week
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

export function RecurringPdfDialog({ open, onClose, invoiceId, invoiceNumber, recurringType }: RecurringPdfDialogProps) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [week, setWeek] = useState(() => {
    // Get current ISO week number
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  });
  const [weekYear, setWeekYear] = useState(today.getFullYear());
  const [day, setDay] = useState(toDateString(today));
  const [loading, setLoading] = useState(false);

  function buildUrl() {
    const base = `/api/rechnungen/${invoiceId}/pdf/recurring`;
    if (recurringType === "MONTHLY") {
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return `${base}?from=${from}&to=${to}`;
    }
    if (recurringType === "WEEKLY") {
      const { start, end } = getWeekRange(weekYear, week);
      return `${base}?from=${toDateString(start)}&to=${toDateString(end)}`;
    }
    // DAILY
    return `${base}?from=${day}&to=${day}`;
  }

  function getFilename() {
    if (recurringType === "MONTHLY") return `${invoiceNumber}_${year}-${String(month).padStart(2, "0")}.pdf`;
    if (recurringType === "WEEKLY") {
      const { start } = getWeekRange(weekYear, week);
      return `${invoiceNumber}_KW${String(week).padStart(2, "0")}-${weekYear}.pdf`;
    }
    return `${invoiceNumber}_${day}.pdf`;
  }

  async function handleDownload() {
    setLoading(true);
    try {
      const url = buildUrl();
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fehler beim Generieren der PDF");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = getFilename();
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert("PDF konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  const weekRange = recurringType === "WEEKLY" ? getWeekRange(weekYear, week) : null;

  const maxWeeks = (y: number) => {
    // A year has 52 or 53 ISO weeks
    const dec28 = new Date(y, 11, 28);
    const dayOfWeek = (dec28.getDay() + 6) % 7;
    const isoWeek = Math.floor((dec28.getTime() - new Date(y, 0, 4).getTime()) / 86400000 / 7) + 1;
    return isoWeek;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>PDF herunterladen — {invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {recurringType === "MONTHLY" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Wählen Sie den Monat für die Rechnung:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Monat</Label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleString("de-DE", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Jahr</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={2000}
                    max={2100}
                  />
                </div>
              </div>
              <div className="rounded-md bg-gray-50 px-4 py-2 text-sm text-gray-700">
                Zeitraum: <strong>{getMonthName(month, year)}</strong>
              </div>
            </div>
          )}

          {recurringType === "WEEKLY" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Wählen Sie die Kalenderwoche:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>KW</Label>
                  <Input
                    type="number"
                    value={week}
                    onChange={(e) => setWeek(Math.min(Number(e.target.value), maxWeeks(weekYear)))}
                    min={1}
                    max={maxWeeks(weekYear)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Jahr</Label>
                  <Input
                    type="number"
                    value={weekYear}
                    onChange={(e) => setWeekYear(Number(e.target.value))}
                    min={2000}
                    max={2100}
                  />
                </div>
              </div>
              {weekRange && (
                <div className="rounded-md bg-gray-50 px-4 py-2 text-sm text-gray-700">
                  Zeitraum:{" "}
                  <strong>
                    {weekRange.start.toLocaleDateString("de-DE")} – {weekRange.end.toLocaleDateString("de-DE")}
                  </strong>
                </div>
              )}
            </div>
          )}

          {recurringType === "DAILY" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Wählen Sie das Datum:</p>
              <div className="space-y-1">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                />
              </div>
              <div className="rounded-md bg-gray-50 px-4 py-2 text-sm text-gray-700">
                Datum:{" "}
                <strong>
                  {new Date(day + "T00:00:00").toLocaleDateString("de-DE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} type="button">Abbrechen</Button>
            <Button onClick={handleDownload} disabled={loading} type="button">
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Wird erstellt..." : "PDF herunterladen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
