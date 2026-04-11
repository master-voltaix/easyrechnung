"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";

interface StatusBadgeProps {
  status: string;
}

const variantMap: Record<string, "muted" | "info" | "success" | "destructive"> = {
  DRAFT: "muted",
  PAID: "success",
  CANCELLED: "destructive",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();

  const labelMap: Record<string, string> = {
    DRAFT: t.invoices.draft,
    PAID: t.invoices.paid,
    CANCELLED: t.invoices.cancelled,
  };

  const label = labelMap[status] ?? status;
  const variant = variantMap[status] ?? "muted";

  return <Badge variant={variant as any}>{label}</Badge>;
}

export function getStatusLabel(status: string, lang: "de" | "en" = "de"): string {
  const labels: Record<string, Record<string, string>> = {
    de: { DRAFT: "Entwurf", PAID: "Bezahlt", CANCELLED: "Storniert" },
    en: { DRAFT: "Draft", PAID: "Paid", CANCELLED: "Cancelled" },
  };
  return labels[lang]?.[status] ?? status;
}
