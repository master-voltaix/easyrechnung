"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";

interface StatusBadgeProps {
  status: string;
  dueDate?: Date | string | null;
}

const variantMap: Record<string, "muted" | "info" | "success" | "destructive" | "warning"> = {
  DRAFT: "muted",
  SENT: "info",
  PAID: "success",
  CANCELLED: "destructive",
};

function isOverdue(status: string, dueDate?: Date | string | null): boolean {
  if (status === "PAID" || status === "CANCELLED") return false;
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function StatusBadge({ status, dueDate }: StatusBadgeProps) {
  const { t } = useLanguage();

  const labelMap: Record<string, string> = {
    DRAFT: t.invoices.draft,
    SENT: "Gesendet",
    PAID: t.invoices.paid,
    CANCELLED: t.invoices.cancelled,
  };

  if (isOverdue(status, dueDate)) {
    return <Badge variant="warning">Überfällig</Badge>;
  }

  const label = labelMap[status] ?? status;
  const variant = variantMap[status] ?? "muted";

  return <Badge variant={variant as any}>{label}</Badge>;
}

export function getStatusLabel(status: string, lang: "de" | "en" = "de"): string {
  const labels: Record<string, Record<string, string>> = {
    de: { DRAFT: "Entwurf", SENT: "Gesendet", PAID: "Bezahlt", CANCELLED: "Storniert" },
    en: { DRAFT: "Draft", SENT: "Sent", PAID: "Paid", CANCELLED: "Cancelled" },
  };
  return labels[lang]?.[status] ?? status;
}
