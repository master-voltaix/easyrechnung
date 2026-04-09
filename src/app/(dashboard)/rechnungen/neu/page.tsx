"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { createInvoice } from "@/lib/actions/invoices";
import { formatEuro } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  companyName: string;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
}

interface Product {
  id: string;
  title: string;
  description?: string | null;
  unitPrice: number;
  vatRate: number;
  unit: string;
}

interface LineItem {
  id: string;
  productId?: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function calcLineTotals(item: LineItem) {
  const net = item.quantity * item.unitPrice;
  const vat = net * (item.vatRate / 100);
  const gross = net + vat;
  return { net, vat, gross };
}

export default function NeueRechnungPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyId = searchParams.get("copy");
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [recurringType, setRecurringType] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY">("NONE");

  const [items, setItems] = useState<LineItem[]>([
    {
      id: generateId(),
      title: "",
      description: "",
      quantity: 1,
      unit: "Stk.",
      unitPrice: 0,
      vatRate: 19,
    },
  ]);

  useEffect(() => {
    fetch("/api/kunden/list").then(r => r.json()).then(d => setCustomers(d.customers ?? []));
    fetch("/api/produkte/list").then(r => r.json()).then(d => setProducts(d.products ?? []));

    if (copyId) {
      // Pre-fill from existing invoice
      fetch(`/api/rechnungen/${copyId}`).then(r => r.json()).then(d => {
        if (d.invoice) {
          const inv = d.invoice;
          setCustomerId(inv.customerId);
          setCustomNote(inv.customNote ?? "");
          setInternalNote(inv.internalNote ?? "");
          setItems(inv.items.map((item: any) => ({
            id: generateId(),
            productId: item.productId ?? undefined,
            title: item.title,
            description: item.description ?? "",
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
          })));
        }
      });
    } else {
      // Pre-fill default note from company profile
      fetch("/api/company/profile").then(r => r.json()).then(d => {
        if (d.profile?.defaultInvoiceNote) {
          setCustomNote(d.profile.defaultInvoiceNote);
        }
      });
    }
  }, [copyId]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        title: "",
        description: "",
        quantity: 1,
        unit: "Stk.",
        unitPrice: 0,
        vatRate: 19,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const addProductAsItem = (product: Product) => {
    setItems([
      ...items,
      {
        id: generateId(),
        productId: product.id,
        title: product.title,
        description: product.description ?? "",
        quantity: 1,
        unit: product.unit,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
      },
    ]);
  };

  const subtotalNet = items.reduce((sum, item) => sum + calcLineTotals(item).net, 0);
  const totalVat = items.reduce((sum, item) => sum + calcLineTotals(item).vat, 0);
  const totalGross = subtotalNet + totalVat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Fehler", description: "Bitte wählen Sie einen Kunden aus.", variant: "destructive" });
      return;
    }
    if (items.length === 0 || items.every(i => !i.title)) {
      toast({ title: "Fehler", description: "Bitte fügen Sie mindestens eine Position hinzu.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await createInvoice({
        customerId,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        customNote: customNote || undefined,
        internalNote: internalNote || undefined,
        recurringType,
        items: items
          .filter((i) => i.title)
          .map((item, index) => ({
            productId: item.productId,
            title: item.title,
            description: item.description || undefined,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            sortOrder: index,
          })),
      });

      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Rechnung erstellt", description: "Die Rechnung wurde erfolgreich erstellt." });
        router.push("/rechnungen");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/rechnungen" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zu Rechnungen
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{copyId ? "Rechnung kopieren" : "Neue Rechnung"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Rechnungsdetails</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Kunde *</Label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Kunde auswählen...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Ausstellungsdatum *</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDate">Leistungsdatum</Label>
              <Input
                id="serviceDate"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick add from products */}
        {products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produkt / Leistung hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <Button
                    key={product.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addProductAsItem(product)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {product.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Positionen</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Position hinzufügen
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Beschreibung</TableHead>
                    <TableHead className="w-20">Menge</TableHead>
                    <TableHead className="w-24">Einheit</TableHead>
                    <TableHead className="w-28">Preis (netto)</TableHead>
                    <TableHead className="w-20">MwSt. %</TableHead>
                    <TableHead className="w-28">Gesamt (brutto)</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const { gross } = calcLineTotals(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            placeholder="Bezeichnung"
                            value={item.title}
                            onChange={(e) => updateItem(item.id, { title: e.target.value })}
                            className="mb-1"
                          />
                          <Input
                            placeholder="Beschreibung (optional)"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.vatRate}
                            onChange={(e) => updateItem(item.id, { vatRate: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatEuro(gross)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gesamt (exkl. MwSt.)</span>
                  <span>{formatEuro(subtotalNet)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">USt. Betrag</span>
                  <span>{formatEuro(totalVat)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Gesamt</span>
                  <span>{formatEuro(totalGross)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recurring */}
        <Card>
          <CardHeader>
            <CardTitle>Zahlungsrhythmus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["NONE", "MONTHLY", "WEEKLY", "DAILY"] as const).map((type) => {
                const labels: Record<string, string> = {
                  NONE: "Einmalig",
                  MONTHLY: "Monatlich",
                  WEEKLY: "Wöchentlich",
                  DAILY: "Täglich",
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecurringType(type)}
                    className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                      recurringType === type
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-input bg-background hover:bg-gray-50"
                    }`}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            {recurringType !== "NONE" && (
              <p className="mt-3 text-sm text-gray-500">
                Diese Rechnung wird als{" "}
                <strong>
                  {recurringType === "MONTHLY" ? "monatlich wiederkehrend" : recurringType === "WEEKLY" ? "wöchentlich wiederkehrend" : "täglich wiederkehrend"}
                </strong>{" "}
                gespeichert. Sie können später für jeden Zeitraum einzeln eine PDF herunterladen.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Hinweise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customNote">Rechnungshinweis (erscheint auf der Rechnung)</Label>
              <Textarea
                id="customNote"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                rows={3}
                placeholder="z.B. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalNote">Interne Notiz (erscheint nicht auf der Rechnung)</Label>
              <Textarea
                id="internalNote"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/rechnungen">
            <Button variant="outline" type="button">Abbrechen</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Wird erstellt..." : "Rechnung erstellen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
