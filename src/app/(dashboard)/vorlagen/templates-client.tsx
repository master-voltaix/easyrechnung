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
  FontSize,
  LogoSize,
  Spacing,
  TableStyle,
} from "@/lib/template-settings";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, RotateCcw, Save, AlertTriangle,
  Minimize2, Square, Maximize2,
  Table, AlignJustify, List,
  Minus, Equal, Plus,
  ChevronsUpDown, ArrowUpDown, Expand,
} from "lucide-react";
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplatesClientProps {
  initialClassic: TemplateSettings;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function isHex(v: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}

function encodeSettings(s: TemplateSettings): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  } catch {
    return btoa(JSON.stringify(s));
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorPicker({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <label className="cursor-pointer shrink-0" title="Farbe wählen">
          <div
            className="w-10 h-10 rounded border border-border shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: isHex(value) ? value : "#1f2937" }}
          />
          <input
            type="color"
            value={isHex(value) ? value : "#1f2937"}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
        </label>
        <Input
          type="text"
          placeholder="#1f2937"
          maxLength={7}
          className="font-mono h-10 text-sm"
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
}: {
  options: { value: T; label: string; preview?: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-colors duration-150 ${
            value === opt.value
              ? "border-foreground bg-foreground text-background font-medium"
              : "border-input bg-background hover:bg-secondary text-foreground"
          }`}
          style={{ borderRadius: "2px", fontFamily: opt.preview || undefined }}
          title={opt.preview ? `Vorschau: ${opt.label}` : undefined}
        >
          {opt.icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
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

function Divider() {
  return <div className="border-t border-border my-5" />;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TemplatesClient({ initialClassic }: TemplatesClientProps) {
  const { toast } = useToast();

  const [settings, setSettings] = useState<TemplateSettings>(initialClassic);
  const [savedSettings, setSavedSettings] = useState<TemplateSettings>(initialClassic);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoom, setZoom] = useState<0.75 | 1>(0.75);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUnsaved = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const update = <K extends keyof TemplateSettings>(key: K, val: TemplateSettings[K]) =>
    setSettings((p) => ({ ...p, [key]: val }));

  const buildUrl = useCallback(
    (s: TemplateSettings) => `/api/templates/preview?key=classic&s=${encodeSettings(s)}`,
    []
  );

  // ── Effects ───────────────────────────────────────────────────────────────

  // Debounced preview update
  useEffect(() => {
    setPreviewLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewSrc(buildUrl(settings)), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [settings, buildUrl]);

  // Warn before unload
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasUnsaved]);

  // ── Save / Reset ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveTemplateSettings("classic", settings);
      if (result.error) {
        toast({ title: "Fehler", description: result.error, variant: "destructive" });
      } else {
        setSavedSettings({ ...settings });
        toast({
          title: "Gespeichert",
          description: "Vorlage wurde erfolgreich gespeichert.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Stable ref so the keyboard shortcut always calls the latest handleSave
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;

  // Ctrl / Cmd + S shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleReset = () => {
    setSettings({ ...CLASSIC_DEFAULTS });
    toast({
      title: "Zurückgesetzt",
      description: "Einstellungen wurden auf Standard zurückgesetzt.",
    });
  };

  // ── Option arrays ─────────────────────────────────────────────────────────

  const fontOptions: { value: FontFamily; label: string; preview?: string }[] = [
    { value: "Helvetica Neue", label: "Helvetica",       preview: "Helvetica Neue, Helvetica, Arial, sans-serif" },
    { value: "Georgia",        label: "Georgia",         preview: "Georgia, serif" },
    { value: "Arial",          label: "Arial",           preview: "Arial, sans-serif" },
    { value: "Times New Roman",label: "Times New Roman", preview: "Times New Roman, Times, serif" },
    { value: "Courier New",    label: "Courier New",     preview: "Courier New, Courier, monospace" },
    { value: "Trebuchet MS",   label: "Trebuchet",       preview: "Trebuchet MS, sans-serif" },
  ];

  const fontSizeOptions: { value: FontSize; label: string; icon: React.ReactNode }[] = [
    { value: "small",  label: "Klein",  icon: <Minus /> },
    { value: "normal", label: "Normal", icon: <Equal /> },
    { value: "large",  label: "Groß",   icon: <Plus /> },
  ];

  const logoOptions: { value: LogoSize; label: string; icon: React.ReactNode }[] = [
    { value: "small",  label: "Klein",  icon: <Minimize2 /> },
    { value: "medium", label: "Mittel", icon: <Square /> },
    { value: "large",  label: "Groß",   icon: <Maximize2 /> },
  ];

  const spacingOptions: { value: Spacing; label: string; icon: React.ReactNode }[] = [
    { value: "compact",  label: "Kompakt",  icon: <ChevronsUpDown /> },
    { value: "normal",   label: "Normal",   icon: <ArrowUpDown /> },
    { value: "spacious", label: "Geräumig", icon: <Expand /> },
  ];

  const tableOptions: { value: TableStyle; label: string; icon: React.ReactNode }[] = [
    { value: "default", label: "Standard",  icon: <Table /> },
    { value: "striped", label: "Gestreift", icon: <AlignJustify /> },
    { value: "minimal", label: "Minimal",   icon: <List /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
            <AlertDialogDescription>
              Du hast ungespeicherte Änderungen. Wenn du jetzt gehst, gehen alle
              Änderungen verloren.
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

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-0 items-start min-h-[calc(100vh-120px)]">
        {/* ── Left: Editor panel ── */}
        <div className="border-r border-border bg-background flex flex-col h-full">

          {/* Panel header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Standardvorlage anpassen</p>
            {hasUnsaved && <UnsavedBadge />}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">

            {/* ── Farbe ── */}
            <div className="px-5 py-5">
              <p className="text-sm font-bold text-foreground mb-4">Farbe</p>
              <div className="flex gap-4">
                {[
                  { key: "primaryColor" as const,    label: "Akzentfarbe" },
                  { key: "accentTextColor" as const, label: "Text auf Akzent" },
                ].map(({ key, label }) => {
                  const val = settings[key] as string;
                  const hex = isHex(val) ? val : "#1f2937";
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <label className="cursor-pointer shrink-0" title={label}>
                        <div
                          className="w-8 h-8 rounded border border-border shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: hex }}
                        />
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => update(key, e.target.value)}
                          className="sr-only"
                        />
                      </label>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
                        <Input
                          type="text"
                          placeholder="#1f2937"
                          maxLength={7}
                          className="font-mono h-6 text-xs px-2 w-24"
                          value={val}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Schriftart ── */}
            <div className="px-5 py-5 bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-4">Schriftart</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <SegmentedControl<FontFamily>
                    options={fontOptions}
                    value={settings.fontFamily}
                    onChange={(v) => update("fontFamily", v)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Klicke eine Schrift an – Vorschau wird sofort aktualisiert.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Textgröße
                  </Label>
                  <SegmentedControl<FontSize>
                    options={fontSizeOptions}
                    value={settings.fontSize}
                    onChange={(v) => update("fontSize", v)}
                  />
                </div>
              </div>
            </div>

            {/* ── Logo ── */}
            <div className="px-5 py-5">
              <p className="text-sm font-bold text-foreground mb-4">Logo</p>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Größe
                </Label>
                <SegmentedControl<LogoSize>
                  options={logoOptions}
                  value={settings.logoSize}
                  onChange={(v) => update("logoSize", v)}
                />
              </div>
            </div>

            {/* ── Layout ── */}
            <div className="px-5 py-5 bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-4">Layout</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tabellenstil
                  </Label>
                  <SegmentedControl<TableStyle>
                    options={tableOptions}
                    value={settings.tableStyle}
                    onChange={(v) => update("tableStyle", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Abstand
                  </Label>
                  <SegmentedControl<Spacing>
                    options={spacingOptions}
                    value={settings.spacing}
                    onChange={(v) => update("spacing", v)}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-border flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-9 text-sm"
              title="Speichern (Ctrl+S)"
            >
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
              className="h-9 px-3 gap-1.5 text-sm"
              title="Auf Standard zurücksetzen"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Zurücksetzen
            </Button>
          </div>
        </div>

        {/* ── Right: Live preview ── */}
        <div className="bg-[#f4f4f4] flex flex-col h-full min-h-[calc(100vh-120px)]">
          <div className="px-5 py-4 border-b border-border bg-background flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              Live-Vorschau
            </span>
            <div className="flex items-center gap-3">
              {previewLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Wird aktualisiert...
                </span>
              )}
              {/* Zoom toggle */}
              <div className="flex items-center border border-border rounded-sm overflow-hidden">
                {([0.75, 1] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`px-2.5 py-1 text-[11px] font-mono transition-colors ${
                      zoom === z
                        ? "bg-foreground text-background"
                        : "bg-background hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {z === 0.75 ? "75%" : "100%"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            {previewSrc ? (
              <div
                style={{
                  width: "794px",
                  height: "1123px",
                  flexShrink: 0,
                  transformOrigin: "top center",
                  transform: `scale(${zoom})`,
                  marginBottom: `${-(1123 * (1 - zoom))}px`,
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
