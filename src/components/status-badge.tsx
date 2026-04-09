import { Badge } from "@/components/ui/badge";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: "muted" | "info" | "success" | "destructive" }> = {
  DRAFT: { label: "Entwurf", variant: "muted" },
  SENT: { label: "Versendet", variant: "info" },
  PAID: { label: "Bezahlt", variant: "success" },
  CANCELLED: { label: "Storniert", variant: "destructive" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "muted" as const };
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function getStatusLabel(status: string): string {
  return statusConfig[status]?.label || status;
}
