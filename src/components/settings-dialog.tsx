"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { Language } from "@/lib/translations";

type DateFormat = "dd.mm.yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
type CurrencyFormat = "de" | "en";

interface AppSettings {
  language: Language;
  dateFormat: DateFormat;
  currencyFormat: CurrencyFormat;
}

const defaults: AppSettings = {
  language: "de",
  dateFormat: "dd.mm.yyyy",
  currencyFormat: "de",
};

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem("qb-settings");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

interface OptionProps {
  value: string;
  current: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

function Option({ value, current, onChange, children }: OptionProps) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors ${
        active
          ? "bg-[#52B876]/10 text-foreground border border-[#52B876]/40"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
      }`}
      style={{ borderRadius: "2px" }}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
          active ? "border-[#52B876] bg-[#52B876]" : "border-muted-foreground/40"
        }`}
      />
      {children}
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono font-medium tracking-widest text-muted-foreground uppercase mb-2">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (open) setSettings(loadSettings());
  }, [open]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    // Persist to localStorage
    localStorage.setItem("qb-settings", JSON.stringify(settings));

    // Set cookie so server components can read it (1 year expiry)
    document.cookie = `qb-lang=${settings.language}; path=/; max-age=31536000; SameSite=Lax`;

    toast({ title: t.settings.saved, description: t.settings.savedDesc });
    setOpen(false);

    // Full page reload so server components re-render with new language
    router.refresh();
    setTimeout(() => window.location.reload(), 150);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#555] hover:text-white hover:bg-white/5 w-full transition-colors duration-150"
          style={{ borderRadius: "2px" }}
        >
          <Settings className="h-4 w-4" />
          {t.nav.settings}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm" style={{ borderRadius: "2px" }}>
        <DialogHeader>
          <DialogTitle
            className="text-base"
            style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
          >
            {t.settings.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <Section label={t.settings.language}>
            <Option value="de" current={settings.language} onChange={(v) => update("language", v as Language)}>
              Deutsch
            </Option>
            <Option value="en" current={settings.language} onChange={(v) => update("language", v as Language)}>
              English
            </Option>
          </Section>

          <Section label={t.settings.dateFormat}>
            <Option value="dd.mm.yyyy" current={settings.dateFormat} onChange={(v) => update("dateFormat", v as DateFormat)}>
              DD.MM.YYYY &nbsp;<span className="text-xs text-muted-foreground font-mono">10.04.2026</span>
            </Option>
            <Option value="mm/dd/yyyy" current={settings.dateFormat} onChange={(v) => update("dateFormat", v as DateFormat)}>
              MM/DD/YYYY &nbsp;<span className="text-xs text-muted-foreground font-mono">04/10/2026</span>
            </Option>
            <Option value="yyyy-mm-dd" current={settings.dateFormat} onChange={(v) => update("dateFormat", v as DateFormat)}>
              YYYY-MM-DD &nbsp;<span className="text-xs text-muted-foreground font-mono">2026-04-10</span>
            </Option>
          </Section>

          <Section label={t.settings.currencyFormat}>
            <Option value="de" current={settings.currencyFormat} onChange={(v) => update("currencyFormat", v as CurrencyFormat)}>
              {t.settings.currencyDe}
            </Option>
            <Option value="en" current={settings.currencyFormat} onChange={(v) => update("currencyFormat", v as CurrencyFormat)}>
              {t.settings.currencyEn}
            </Option>
          </Section>
        </div>

        <div className="pt-2">
          <button
            onClick={save}
            className="w-full py-2.5 text-sm font-semibold text-white bg-[#52B876] hover:bg-[#3FA364] transition-colors duration-150"
            style={{ borderRadius: "2px" }}
          >
            {t.settings.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
