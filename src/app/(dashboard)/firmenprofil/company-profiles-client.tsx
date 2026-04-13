"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  createCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
  setDefaultCompanyProfile,
} from "@/lib/actions/company";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Plus, Pencil, Trash2, Star, Upload, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface CompanyProfileData {
  id: string;
  profileName: string;
  isDefault: boolean;
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
  profileName: z.string().min(1, "Profilname ist erforderlich"),
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
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Props {
  initialProfiles: CompanyProfileData[];
}

function ProfileForm({
  profile,
  onSave,
  onCancel,
}: {
  profile: CompanyProfileData | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(profile?.logoUrl ?? null);
  const [logoCacheBust, setLogoCacheBust] = useState(() => Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      profileName: profile?.profileName ?? "Neues Profil",
      companyName: profile?.companyName ?? "",
      ownerName: profile?.ownerName ?? "",
      street: profile?.street ?? "",
      postalCode: profile?.postalCode ?? "",
      city: profile?.city ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      website: profile?.website ?? "",
      vatId: profile?.vatId ?? "",
      taxNumber: profile?.taxNumber ?? "",
      iban: profile?.iban ?? "",
      bic: profile?.bic ?? "",
      bankName: profile?.bankName ?? "",
      accountHolder: profile?.accountHolder ?? "",
      defaultInvoiceNote: profile?.defaultInvoiceNote ?? "",
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const payload = { ...data, logoUrl: logoUrl ?? undefined };
      const result = profile
        ? await updateCompanyProfile(profile.id, payload)
        : await createCompanyProfile(payload);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gespeichert", description: "Firmenprofil wurde gespeichert." });
        onSave();
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
        setLogoCacheBust(Date.now());
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (profile) {
          await updateCompanyProfile(profile.id, { ...getValues(), logoUrl: data.url });
        }
        toast({ title: "Logo hochgeladen" });
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
            <CardHeader><CardTitle>Profilname</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="profileName">Name dieses Profils (intern)</Label>
                <Input id="profileName" placeholder="z.B. Hauptfirma, Nebentätigkeit..." {...register("profileName")} />
                {errors.profileName && <p className="text-sm text-red-500">{errors.profileName.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl && (
                <img src={`${logoUrl}?v=${logoCacheBust}`} alt="Logo" className="h-16 object-contain border rounded p-2" />
              )}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} className="sr-only" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={logoUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {logoUploading ? "Wird hochgeladen..." : "Logo hochladen"}
                </Button>
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

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </div>
    </form>
  );
}

export function CompanyProfilesClient({ initialProfiles }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [profiles, setProfiles] = useState<CompanyProfileData[]>(initialProfiles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const result = await deleteCompanyProfile(deleteId);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Gelöscht" });
        refresh();
      }
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionLoading(id);
    try {
      const result = await setDefaultCompanyProfile(id);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Standard gesetzt" });
        refresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (creating) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Neues Firmenprofil erstellen</h2>
        <ProfileForm
          profile={null}
          onSave={() => { setCreating(false); refresh(); }}
          onCancel={() => setCreating(false)}
        />
      </div>
    );
  }

  if (editingId) {
    const profile = initialProfiles.find(p => p.id === editingId) ?? null;
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Profil bearbeiten</h2>
        <ProfileForm
          profile={profile}
          onSave={() => { setEditingId(null); refresh(); }}
          onCancel={() => setEditingId(null)}
        />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profil löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Firmenprofil wird dauerhaft gelöscht. Bestehende Rechnungen behalten ihre Daten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        {initialProfiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Noch kein Firmenprofil vorhanden.</p>
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Profil erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {initialProfiles.map((profile) => (
              <Card key={profile.id} className={profile.isDefault ? "border-[#52B876] border-2" : ""}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {profile.logoUrl && (
                      <img src={profile.logoUrl} alt="Logo" className="h-10 w-16 object-contain border rounded p-1 shrink-0" />
                    )}
                    {!profile.logoUrl && (
                      <div className="h-10 w-10 rounded border flex items-center justify-center bg-muted shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{profile.profileName}</p>
                        {profile.isDefault && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#52B876]/10 text-[#52B876] border border-[#52B876]/30 rounded-sm">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{profile.companyName}</p>
                      {(profile.street || profile.city) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[profile.street, [profile.postalCode, profile.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!profile.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === profile.id}
                        onClick={() => handleSetDefault(profile.id)}
                        title="Als Standard setzen"
                        className="text-[#52B876] border-[#52B876]/30 hover:bg-[#52B876]/10"
                      >
                        <Star className="h-3.5 w-3.5 mr-1" />
                        Standard
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(profile.id)}
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Bearbeiten
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === profile.id || initialProfiles.length === 1}
                      onClick={() => setDeleteId(profile.id)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      title={initialProfiles.length === 1 ? "Letztes Profil kann nicht gelöscht werden" : "Löschen"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={() => setCreating(true)} variant="outline" className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Weiteres Firmenprofil hinzufügen
            </Button>
          </>
        )}
      </div>
    </>
  );
}
