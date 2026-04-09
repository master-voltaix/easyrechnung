"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { updateInvoice } from "@/lib/actions/invoices";
import { formatEuro } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Customer { id: string; companyName: string; }
interface Product { id: string; title: string; description?: string | null; unitPrice: number; vatRate: number; unit: string; }
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

function genId() { return Math.random().toString(36).substring(2, 9); }
function calcGross(item: LineItem) {
  const net = item.quantity * item.unitPrice;
  return net + net * (item.vatRate / 100);
}

export default function EditRechnungPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [recurringType, setRecurringType] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY">("NONE");
  const [items, setItems] = useState<LineItem[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const [custRes, prodRes, invRes] = await Promise.all([
        fetch("/api/kunden/list").then(r => r.json()),
        fetch("/api/produkte/list").then(r => r.json()),
        fetch(`/api/rechnungen/${params.id}`).then(r => r.json()),
      ]);
      setCustomers(custRes.customers ?? []);
      setProducts(prodRes.products ?? []);

      if (invRes.invoice) {
        const inv = invRes.invoice;
        setInvoiceStatus(inv.status);

        // Prevent editing paid invoices
        if (inv.status === "PAID") {
          toast({
            title: "Nicht möglich",
            description: "Bezahlte Rechnungen können nicht bearbeitet werden. Sie können nur das Bezahlt-Datum ändern.",
            variant: "destructive",
          });
          setTimeout(() => router.back(), 2000);
          setFetchLoading(false);
          return;
        }

        setCustomerId(inv.customerId);
        setIssueDate(inv.issueDate.split("T")[0]);
        setDueDate(inv.dueDate ? inv.dueDate.split("T")[0] : "");
        setServiceDate(inv.serviceDate ? inv.serviceDate.split("T")[0] : "");
        setCustomNote(inv.customNote ?? "");
        setInternalNote(inv.internalNote ?? "");
        setRecurringType(inv.recurringType ?? "NONE");
        setItems(inv.items.map((item: any) => ({
          id: genId(),
          productId: item.productId ?? undefined,
          title: item.title,
          description: item.description ?? "",
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
        })));
      }
      setFetchLoading(false);
    };
    init();
  }, [params.id]);

  const addItem = () => setItems([...items, { id: genId(), title: "", description: "", quantity: 1, unit: "Stk.", unitPrice: 0, vatRate: 19 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, upd: Partial<LineItem>) => setItems(items.map(i => i.id === id ? { ...i, ...upd } : i));
  const addProduct = (p: Product) => setItems([...items, { id: genId(), productId: p.id, title: p.title, description: p.description ?? "", quantity: 1, unit: p.unit, unitPrice: p.unitPrice, vatRate: p.vatRate }]);

  const subtotalNet = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalVat = items.reduce((s, i) => { const n = i.quantity * i.unitPrice; return s + n * (i.vatRate / 100); }, 0);
  const totalGross = subtotalNet + totalVat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast({ title: "Fehler", description: "Bitte Kunden auswählen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await updateInvoice(params.id as string, {
        customerId,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        customNote: customNote || undefined,
        internalNote: internalNote || undefined,
        recurringType,
        items: items.filter(i => i.title).map((item, index) => ({
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
        toast({ title: "Gespeichert", description: "Rechnung wurde aktualisiert." });
        router.push(`/rechnungen/${params.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="flex items-center justify-center py-12">Wird geladen...</div>;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/rechnungen/${params.id}`} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />Zurück zur Rechnung
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Rechnung bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kunde *</Label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Auswählen...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ausstellungsdatum</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fälligkeitsdatum</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Leistungsdatum</Label>
              <Input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {products.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Produkt hinzufügen</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {products.map(p => (
                  <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => addProduct(p)}>
                    <Plus className="h-3 w-3 mr-1" />{p.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Positionen</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />Hinzufügen
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Beschreibung</TableHead>
                    <TableHead className="w-20">Menge</TableHead>
                    <TableHead className="w-20">Einheit</TableHead>
                    <TableHead className="w-28">Preis (netto)</TableHead>
                    <TableHead className="w-20">MwSt. %</TableHead>
                    <TableHead className="w-28">Gesamt</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input placeholder="Bezeichnung" value={item.title} onChange={e => updateItem(item.id, { title: e.target.value })} className="mb-1" />
                        <Input placeholder="Beschreibung" value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} className="text-xs" />
                      </TableCell>
                      <TableCell><Input type="number" min="0" step="0.001" value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} /></TableCell>
                      <TableCell><Input value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })} /></TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} /></TableCell>
                      <TableCell><Input type="number" min="0" max="100" step="0.01" value={item.vatRate} onChange={e => updateItem(item.id, { vatRate: parseFloat(e.target.value) || 0 })} /></TableCell>
                      <TableCell className="font-medium">{formatEuro(calcGross(item))}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Netto</span><span>{formatEuro(subtotalNet)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">MwSt.</span><span>{formatEuro(totalVat)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2"><span>Gesamt</span><span>{formatEuro(totalGross)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Zahlungsrhythmus</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["NONE", "MONTHLY", "WEEKLY", "DAILY"] as const).map((type) => {
                const labels: Record<string, string> = { NONE: "Einmalig", MONTHLY: "Monatlich", WEEKLY: "Wöchentlich", DAILY: "Täglich" };
                return (
                  <button key={type} type="button" onClick={() => setRecurringType(type)}
                    className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${recurringType === type ? "border-gray-900 bg-gray-900 text-white" : "border-input bg-background hover:bg-gray-50"}`}>
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            {recurringType !== "NONE" && (
              <p className="mt-3 text-sm text-gray-500">
                Diese Rechnung wird als <strong>{recurringType === "MONTHLY" ? "monatlich wiederkehrend" : recurringType === "WEEKLY" ? "wöchentlich wiederkehrend" : "täglich wiederkehrend"}</strong> gespeichert.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hinweise</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rechnungshinweis</Label>
              <Textarea value={customNote} onChange={e => setCustomNote(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Interne Notiz</Label>
              <Textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/rechnungen/${params.id}`}><Button variant="outline" type="button">Abbrechen</Button></Link>
          <Button type="submit" disabled={loading}>{loading ? "Wird gespeichert..." : "Speichern"}</Button>
        </div>
      </form>
    </div>
  );
}
