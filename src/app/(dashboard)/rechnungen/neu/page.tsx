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
import { createCustomer } from "@/lib/actions/customers";
import { formatEuro } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, UserPlus, X } from "lucide-react";

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

  // Customer selection
  const [customerId, setCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerStreet, setNewCustomerStreet] = useState("");
  const [newCustomerPostal, setNewCustomerPostal] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [recurringType, setRecurringType] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY">("NONE");
  const templateKey = "classic";

  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), title: "", description: "", quantity: 1, unit: "Stk.", unitPrice: 0, vatRate: 19 },
  ]);

  useEffect(() => {
    fetch("/api/kunden/list").then(r => r.json()).then(d => setCustomers(d.customers ?? []));
    fetch("/api/produkte/list").then(r => r.json()).then(d => setProducts(d.products ?? []));

    if (copyId) {
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
      fetch("/api/company/profile").then(r => r.json()).then(d => {
        if (d.profile?.defaultInvoiceNote) setCustomNote(d.profile.defaultInvoiceNote);
      });
    }
  }, [copyId]);

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: generateId(), title: "", description: "", quantity: 1, unit: "Stk.", unitPrice: 0, vatRate: 19 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Add pre-made product to TOP of items list
  const addProductAsItem = (product: Product) => {
    const newItem: LineItem = {
      id: generateId(),
      productId: product.id,
      title: product.title,
      description: product.description ?? "",
      quantity: 1,
      unit: product.unit,
      unitPrice: product.unitPrice,
      vatRate: product.vatRate,
    };
    setItems(prev => [newItem, ...prev]);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({ title: "Fehler", description: "Firmenname ist erforderlich.", variant: "destructive" });
      return;
    }
    setSavingCustomer(true);
    try {
      const result = await createCustomer({
        companyName: newCustomerName.trim(),
        email: newCustomerEmail.trim() || undefined,
        street: newCustomerStreet.trim() || undefined,
        postalCode: newCustomerPostal.trim() || undefined,
        city: newCustomerCity.trim() || undefined,
      });
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else if (result.customer) {
        const newC: Customer = { id: result.customer.id, companyName: result.customer.companyName };
        setCustomers(prev => [newC, ...prev]);
        setCustomerId(result.customer!.id);
        setShowNewCustomer(false);
        setNewCustomerName("");
        setNewCustomerEmail("");
        setNewCustomerStreet("");
        setNewCustomerPostal("");
        setNewCustomerCity("");
        toast({ title: "Kunde erstellt", description: `"${result.customer.companyName}" wurde angelegt.` });
      }
    } finally {
      setSavingCustomer(false);
    }
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
      toast({ title: "Fehler", description: "Bitte fügen Sie mindestens ein Produkt hinzu.", variant: "destructive" });
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
        templateKey,
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
        <Link href="/rechnungen" className="flex items-center text-muted-foreground hover:text-foreground mb-4 text-sm gap-1">
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Rechnungen
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{copyId ? "Rechnung kopieren" : "Neue Rechnung"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Rechnungsdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer selector — 2-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Left: existing customer dropdown */}
              <div className="space-y-2">
                <Label htmlFor="customer">Kunde *</Label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ borderRadius: "2px" }}
                >
                  <option value="">Kunde auswählen...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              {/* Right: new customer panel */}
              <div className="space-y-2">
                <Label className="invisible md:visible">Neuer Kunde</Label>
                {!showNewCustomer ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="flex items-center gap-1.5 h-10 px-3 w-full border border-dashed border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                    style={{ borderRadius: "2px" }}
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    Neuen Kunden anlegen
                  </button>
                ) : (
                  <div className="border border-border p-4 space-y-3 bg-secondary/30" style={{ borderRadius: "2px" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono font-medium tracking-widest text-muted-foreground uppercase">Neuer Kunde</p>
                      <button type="button" onClick={() => setShowNewCustomer(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Firmenname *</Label>
                        <Input placeholder="Muster GmbH" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">E-Mail</Label>
                        <Input type="email" placeholder="info@kunde.de" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Straße</Label>
                        <Input placeholder="Musterstraße 1" value={newCustomerStreet} onChange={(e) => setNewCustomerStreet(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">PLZ</Label>
                        <Input placeholder="12345" value={newCustomerPostal} onChange={(e) => setNewCustomerPostal(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ort</Label>
                        <Input placeholder="Berlin" value={newCustomerCity} onChange={(e) => setNewCustomerCity(e.target.value)} />
                      </div>
                    </div>
                    <Button type="button" size="sm" onClick={handleCreateCustomer} disabled={savingCustomer || !newCustomerName.trim()}>
                      {savingCustomer ? "Wird gespeichert..." : "Kunde anlegen & auswählen"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Ausstellungsdatum *</Label>
                <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <div className="flex gap-1.5">
                  {[7, 14, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        const base = issueDate ? new Date(issueDate) : new Date();
                        base.setDate(base.getDate() + days);
                        setDueDate(base.toISOString().split("T")[0]);
                      }}
                      className="px-2 py-1 text-xs border border-input bg-background hover:bg-secondary hover:border-foreground transition-colors"
                      style={{ borderRadius: "2px" }}
                    >
                      +{days} Tage
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Leistungsdatum</Label>
                <Input id="serviceDate" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
              </div>
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
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductAsItem(product)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border hover:border-[#52B876] hover:bg-[#52B876]/5 transition-colors duration-150 text-left"
                    style={{ borderRadius: "2px" }}
                  >
                    <Plus className="h-3.5 w-3.5 text-[#52B876] shrink-0" />
                    <span className="font-medium">{product.title}</span>
                    <span className="text-muted-foreground font-mono text-xs ml-1">{formatEuro(product.unitPrice)}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produkt / Leistung</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Manuell hinzufügen
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
                          <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} />
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
                        <TableCell className="font-medium font-mono text-sm">{formatEuro(gross)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
                  <span className="text-muted-foreground">Gesamt (exkl. MwSt.)</span>
                  <span className="font-mono">{formatEuro(subtotalNet)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">USt. Betrag</span>
                  <span className="font-mono">{formatEuro(totalVat)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                  <span>Gesamt</span>
                  <span className="font-mono">{formatEuro(totalGross)}</span>
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
                  NONE: "Einmalig", MONTHLY: "Monatlich", WEEKLY: "Wöchentlich", DAILY: "Täglich",
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecurringType(type)}
                    className={`border px-4 py-3 text-sm font-medium transition-colors ${
                      recurringType === type
                        ? "border-foreground bg-foreground text-background"
                        : "border-input bg-background hover:bg-secondary"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>
            {recurringType !== "NONE" && (
              <p className="mt-3 text-sm text-muted-foreground">
                Diese Rechnung wird als{" "}
                <strong className="text-foreground">
                  {recurringType === "MONTHLY" ? "monatlich wiederkehrend" : recurringType === "WEEKLY" ? "wöchentlich wiederkehrend" : "täglich wiederkehrend"}
                </strong>{" "}
                gespeichert.
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
              <Textarea id="internalNote" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} />
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
