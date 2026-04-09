"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { updateCustomer } from "@/lib/actions/customers";
import { ArrowLeft } from "lucide-react";

const customerSchema = z.object({
  companyName: z.string().min(1, "Firmenname ist erforderlich"),
  contactPerson: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  phone: z.string().optional(),
  vatId: z.string().optional(),
  notes: z.string().optional(),
  totalPrice: z.string().optional(),
  textField: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function EditKundePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/kunden/${params.id}`);
        const data = await res.json();
        if (data.customer) {
          reset({
            companyName: data.customer.companyName ?? "",
            contactPerson: data.customer.contactPerson ?? "",
            street: data.customer.street ?? "",
            postalCode: data.customer.postalCode ?? "",
            city: data.customer.city ?? "",
            email: data.customer.email ?? "",
            phone: data.customer.phone ?? "",
            vatId: data.customer.vatId ?? "",
            notes: data.customer.notes ?? "",
            totalPrice: data.customer.totalPrice != null ? String(data.customer.totalPrice) : "",
            textField: data.customer.textField ?? "",
          });
        }
      } catch {
        toast({ title: "Fehler", description: "Kunde konnte nicht geladen werden.", variant: "destructive" });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchCustomer();
  }, [params.id, reset, toast]);

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      const totalPriceNum = data.totalPrice ? parseFloat(data.totalPrice.replace(",", ".")) : null;
      const result = await updateCustomer(params.id as string, {
        ...data,
        totalPrice: isNaN(totalPriceNum as number) ? null : totalPriceNum,
      });
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gespeichert", description: "Kunde wurde erfolgreich aktualisiert." });
        router.push("/kunden");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="flex items-center justify-center py-12">Wird geladen...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/kunden" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zu Kunden
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Kunde bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Kundendaten</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname *</Label>
              <Input id="companyName" {...register("companyName")} />
              {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Ansprechpartner</Label>
              <Input id="contactPerson" {...register("contactPerson")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Straße und Hausnummer</Label>
              <Input id="street" {...register("street")} />
            </div>
            <div className="space-y-2 grid grid-cols-2 gap-2 items-end">
              <div>
                <Label htmlFor="postalCode">PLZ</Label>
                <Input id="postalCode" {...register("postalCode")} />
              </div>
              <div>
                <Label htmlFor="city">Ort</Label>
                <Input id="city" {...register("city")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatId">USt-ID</Label>
              <Input id="vatId" {...register("vatId")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Gesamtpreis (€)</Label>
              <Input id="totalPrice" placeholder="0.00" {...register("totalPrice")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="textField">Text</Label>
              <Textarea id="textField" {...register("textField")} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" {...register("notes")} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/kunden">
            <Button variant="outline" type="button">Abbrechen</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </div>
      </form>
    </div>
  );
}
