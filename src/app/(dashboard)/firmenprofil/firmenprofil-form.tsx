"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { upsertCompanyProfile } from "@/lib/actions/company";

interface CompanyProfileData {
  id: string;
  companyName: string;
  ownerName: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  vatId: string | null;
  taxNumber: string | null;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  accountHolder: string | null;
  defaultInvoiceNote: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = z.object({
  companyName: z.string().min(1, "Firmenname ist erforderlich"),
  ownerName: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  website: z.string().optional(),
  vatId: z.string().optional(),
  taxNumber: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  defaultInvoiceNote: z.string().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiges Farbformat").optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface FirmenprofilFormProps {
  initialProfile: CompanyProfileData | null;
}

export function FirmenprofilForm({ initialProfile }: FirmenprofilFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialProfile?.logoUrl ?? null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: initialProfile?.companyName ?? "",
      ownerName: initialProfile?.ownerName ?? "",
      street: initialProfile?.street ?? "",
      postalCode: initialProfile?.postalCode ?? "",
      city: initialProfile?.city ?? "",
      phone: initialProfile?.phone ?? "",
      email: initialProfile?.email ?? "",
      website: initialProfile?.website ?? "",
      vatId: initialProfile?.vatId ?? "",
      taxNumber: initialProfile?.taxNumber ?? "",
      iban: initialProfile?.iban ?? "",
      bic: initialProfile?.bic ?? "",
      bankName: initialProfile?.bankName ?? "",
      accountHolder: initialProfile?.accountHolder ?? "",
      defaultInvoiceNote: initialProfile?.defaultInvoiceNote ?? "",
      accentColor: initialProfile?.accentColor ?? "#1f2937",
    },
  });

  const watchedColor = watch("accentColor") ?? "#1f2937";

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const result = await upsertCompanyProfile({ ...data, logoUrl: logoUrl ?? undefined });
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gespeichert", description: "Firmenprofil wurde erfolgreich gespeichert." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        toast({ title: "Logo hochgeladen", description: "Logo wurde erfolgreich hochgeladen." });
      }
    } catch {
      toast({ title: "Fehler", description: "Logo konnte nicht hochgeladen werden.", variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="allgemein" className="w-full">
        <TabsList>
          <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
          <TabsTrigger value="bankverbindung">Bankverbindung</TabsTrigger>
        </TabsList>

        <TabsContent value="allgemein" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Laden Sie Ihr Firmenlogo hoch (erscheint auf Rechnungen).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl && (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo" className="h-16 object-contain border rounded p-2" />
                </div>
              )}
              <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} />
              {logoUploading && <p className="text-sm text-gray-500">Wird hochgeladen...</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Designfarbe</CardTitle>
              <CardDescription>Wählen Sie die Akzentfarbe für Ihre Rechnungen (wird in Kopfzeilen und Borders verwendet).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accentColor">Designfarbe für Rechnungen</Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer shrink-0" title="Farbe wählen">
                    <div
                      className="w-9 h-9 rounded-md border border-border"
                      style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(watchedColor) ? watchedColor : "#1f2937" }}
                    />
                    <input
                      type="color"
                      value={/^#[0-9A-Fa-f]{6}$/.test(watchedColor) ? watchedColor : "#1f2937"}
                      onChange={(e) => setValue("accentColor", e.target.value)}
                      className="sr-only"
                    />
                  </label>
                  <Input
                    id="accentColor"
                    type="text"
                    placeholder="#1f2937"
                    maxLength={7}
                    className="font-mono w-36"
                    {...register("accentColor")}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Farbfeld anklicken oder Hex-Code eingeben, z.B. #2563eb</p>
                {errors.accentColor && <p className="text-sm text-red-500">{errors.accentColor.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Firmendaten</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Firmenname *</Label>
                <Input id="companyName" {...register("companyName")} />
                {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Inhaber / Geschäftsführer</Label>
                <Input id="ownerName" {...register("ownerName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Straße und Hausnummer</Label>
                <Input id="street" {...register("street")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input id="postalCode" {...register("postalCode")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ort</Label>
                  <Input id="city" {...register("city")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Webseite</Label>
                <Input id="website" {...register("website")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bankverbindung" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Bankverbindung</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Kreditinstitut</Label>
                <Input id="bankName" {...register("bankName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Kontoinhaber</Label>
                <Input id="accountHolder" {...register("accountHolder")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input id="iban" placeholder="DE00 0000 0000 0000 0000 00" {...register("iban")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bic">BIC</Label>
                <Input id="bic" {...register("bic")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Steuerliche Angaben</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatId">USt-ID</Label>
                <Input id="vatId" placeholder="DE123456789" {...register("vatId")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Steuernummer</Label>
                <Input id="taxNumber" {...register("taxNumber")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Standard-Rechnungshinweis</CardTitle>
              <CardDescription>Dieser Text erscheint standardmäßig auf Ihren Rechnungen (z.B. §19 UStG Kleinunternehmerregelung).</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("defaultInvoiceNote")}
                rows={4}
                placeholder="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
