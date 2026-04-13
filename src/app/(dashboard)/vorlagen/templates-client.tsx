"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTemplateSettings } from "@/lib/actions/templates";
import {
  TemplateSettings,
  CLASSIC_DEFAULTS,
  FontFamily,
  LogoSize,
  Spacing,
  TableStyle,
} from "@/lib/template-settings";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RotateCcw, Save, AlertTriangle } from "lucide-react";
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

interface TemplatesClientProps {
  initialSettings: TemplateSettings;
}

function encodeSettings(s: TemplateSettings): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  } catch {
    return btoa(JSON.stringify(s));
  }
}

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#52B876] text-white text-[10px] font-bold shrink-0">
      {n}
    </span>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
  number,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  number?: number;
}) {
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {number !== undefined && <NumberBadge n={number} />}
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <label className="cursor-pointer shrink-0" title="Farbe wählen">
          <div
            className="w-8 h-8 rounded border border-border shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: isValid ? value : "#1f2937" }}
          />
          <input
            type="color"
            value={isValid ? value : "#1f2937"}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
        </label>
        <Input
          type="text"
          placeholder="#1f2937"
          maxLength={7}
          className="font-mono h-8 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  number,
}: {
  options: { value: T; label: string; preview?: string }[];
  value: T;
  onChange: (v: T) => void;
  number?: number;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs border transition-colors duration-150 ${
            value === opt.value
              ? "border-foreground bg-foreground text-background font-medium"
              : "border-input bg-background hover:bg-secondary text-foreground"
          }`}
          style={{ borderRadius: "2px", fontFamily: opt.preview || undefined }}
          title={opt.preview ? `Vorschau: ${opt.label}` : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children, number }: { children: React.ReactNode; number?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      {number !== undefined && <NumberBadge n={number} />}
      <p className="text-[10px] font-mono font-medium tracking-widest text-muted-foreground uppercase">
        {children}
      </p>
    </div>
  );
}

function UnsavedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-sm">
      <AlertTriangle className="h-3 w-3" />
      Ungespeichert
    </span>
  );
}

export function TemplatesClient({ initialSettings }: TemplatesClientProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TemplateSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<TemplateSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUnsaved = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // Warn before browser unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const update = <K extends keyof TemplateSettings>(key: K, value: TemplateSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const buildPreviewUrl = useCallback((s: TemplateSettings) => {
    return `/api/templates/preview?key=classic&s=${encodeSettings(s)}`;
  }, []);

  useEffect(() => {
    setPreviewLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewSrc(buildPreviewUrl(settings));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [settings, buildPreviewUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveTemplateSettings("classic", settings);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        setSavedSettings({ ...settings });
        toast({ title: "Gespeichert", description: "Vorlage wurde erfolgreich gespeichert." });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...CLASSIC_DEFAULTS });
    toast({ title: "Zurückgesetzt", description: "Alle Einstellungen wurden zurückgesetzt." });
  };

  const fontOptions: { value: FontFamily; label: string; preview?: string }[] = [
    { value: "Helvetica Neue", label: "Helvetica", preview: "Helvetica Neue, Helvetica, Arial, sans-serif" },
    { value: "Georgia", label: "Georgia", preview: "Georgia, serif" },
    { value: "Arial", label: "Arial", preview: "Arial, sans-serif" },
    { value: "Times New Roman", label: "Times New Roman", preview: "Times New Roman, Times, serif" },
    { value: "Courier New", label: "Courier New", preview: "Courier New, Courier, monospace" },
    { value: "Trebuchet MS", label: "Trebuchet", preview: "Trebuchet MS, sans-serif" },
  ];

  const logoOptions: { value: LogoSize; label: string }[] = [
    { value: "small", label: "Klein" },
    { value: "medium", label: "Mittel" },
    { value: "large", label: "Groß" },
  ];

  const spacingOptions: { value: Spacing; label: string }[] = [
    { value: "compact", label: "Kompakt" },
    { value: "normal", label: "Normal" },
    { value: "spacious", label: "Geräumig" },
  ];

  const tableOptions: { value: TableStyle; label: string }[] = [
    { value: "default", label: "Standard" },
    { value: "striped", label: "Gestreift" },
    { value: "minimal", label: "Minimal" },
  ];

  return (
    <>
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
            <AlertDialogDescription>
              Du hast ungespeicherte Änderungen. Wenn du jetzt gehst, gehen alle Änderungen verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bleiben</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => window.history.back()}
            >
              Trotzdem verlassen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0 items-start min-h-[calc(100vh-120px)]">
        {/* Left: Editor panel */}
        <div className="border-r border-border bg-background flex flex-col h-full">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Standardvorlage anpassen</p>
            {hasUnsaved && <UnsavedBadge />}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
            {/* Colors */}
            <SectionTitle number={1}>Farben</SectionTitle>
            <div className="space-y-4">
              <ColorPicker
                label="Akzentfarbe (Header, Rahmen)"
                value={settings.primaryColor}
                onChange={(v) => update("primaryColor", v)}
                number={1}
              />
              <ColorPicker
                label="Textfarbe auf Akzent"
                value={settings.accentTextColor}
                onChange={(v) => update("accentTextColor", v)}
                number={2}
              />
              <ColorPicker
                label="Fließtext"
                value={settings.textColor}
                onChange={(v) => update("textColor", v)}
                number={3}
              />
            </div>

            {/* Typography */}
            <SectionTitle number={4}>Schriftart</SectionTitle>
            <div className="space-y-1.5">
              <SegmentedControl<FontFamily>
                options={fontOptions}
                value={settings.fontFamily}
                onChange={(v) => update("fontFamily", v)}
                number={4}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Klicke eine Schrift an – Vorschau wird sofort aktualisiert.
              </p>
            </div>

            {/* Logo */}
            <SectionTitle number={5}>Logo</SectionTitle>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <NumberBadge n={5} />
                Logogröße
              </Label>
              <SegmentedControl<LogoSize>
                options={logoOptions}
                value={settings.logoSize}
                onChange={(v) => update("logoSize", v)}
              />
            </div>

            {/* Layout */}
            <SectionTitle number={6}>Layout</SectionTitle>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <NumberBadge n={6} />
                  Abstände
                </Label>
                <SegmentedControl<Spacing>
                  options={spacingOptions}
                  value={settings.spacing}
                  onChange={(v) => update("spacing", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <NumberBadge n={7} />
                  Tabellenstil
                </Label>
                <SegmentedControl<TableStyle>
                  options={tableOptions}
                  value={settings.tableStyle}
                  onChange={(v) => update("tableStyle", v)}
                />
              </div>
            </div>

            {/* Number Legend */}
            <div className="mt-6 p-3 bg-muted/40 border border-border rounded-sm space-y-1.5">
              <p className="text-[10px] font-mono font-medium tracking-widest text-muted-foreground uppercase mb-2">Legende</p>
              {[
                [1, "Akzentfarbe → Tabellenheader, Trennlinien"],
                [2, "Textfarbe auf Akzent → Spaltenüberschriften"],
                [3, "Fließtext → Adresse, Positionen, Notizen"],
                [4, "Schriftart → gesamtes Dokument"],
                [5, "Logo → oben rechts im Header"],
                [6, "Abstände → Innenabstand aller Bereiche"],
                [7, "Tabellenstil → Zebra / Minimal / Standard"],
              ].map(([n, desc]) => (
                <div key={n} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <NumberBadge n={n as number} />
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-border flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 h-9 text-sm">
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Speichern
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 px-3"
              title="Auf Standard zurücksetzen"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="bg-[#f4f4f4] flex flex-col h-full min-h-[calc(100vh-120px)]">
          <div className="px-5 py-4 border-b border-border bg-background flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              Live-Vorschau
            </span>
            {previewLoading && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Wird aktualisiert...
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            {previewSrc ? (
              <div
                style={{
                  width: "794px",
                  height: "1123px",
                  flexShrink: 0,
                  transformOrigin: "top center",
                  transform: "scale(0.75)",
                  marginBottom: "-282px",
                }}
              >
                <iframe
                  key={previewSrc}
                  src={previewSrc}
                  title="Vorlagenvorschau"
                  onLoad={() => setPreviewLoading(false)}
                  style={{
                    width: "794px",
                    height: "1123px",
                    border: "none",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                    background: "white",
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Vorschau wird geladen...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
