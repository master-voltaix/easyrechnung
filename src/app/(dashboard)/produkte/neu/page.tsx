"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createProduct } from "@/lib/actions/products";
import { ArrowLeft } from "lucide-react";

const productSchema = z.object({
  title: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Preis muss positiv sein"),
  vatRate: z.coerce.number().min(0).max(100),
  unit: z.string().min(1, "Einheit ist erforderlich"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NeuesProduktPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: "Stk.", vatRate: 19 },
  });

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const result = await createProduct(data);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gespeichert", description: "Produkt wurde erfolgreich angelegt." });
        router.push("/produkte");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/produkte" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zu Produkte
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Neues Produkt / Leistung</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Produktdaten</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Bezeichnung *</Label>
              <Input id="title" {...register("title")} placeholder="z.B. Webdesign, Beratung, ..." />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea id="description" {...register("description")} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Preis pro Einheit (netto) in €</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                {...register("unitPrice")}
              />
              {errors.unitPrice && <p className="text-sm text-red-500">{errors.unitPrice.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Input id="unit" {...register("unit")} placeholder="Stk., Std., Monat, ..." />
              {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatRate">MwSt.-Satz (%)</Label>
              <Input
                id="vatRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("vatRate")}
              />
              {errors.vatRate && <p className="text-sm text-red-500">{errors.vatRate.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/produkte">
            <Button variant="outline" type="button">Abbrechen</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Wird gespeichert..." : "Produkt anlegen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
