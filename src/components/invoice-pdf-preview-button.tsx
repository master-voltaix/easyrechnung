"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, X, Download, Loader2 } from "lucide-react";

interface Props {
  invoiceId: string;
  invoiceNumber?: string;
  variant?: "outline" | "ghost";
  iconOnly?: boolean;
}

export function InvoicePdfPreviewButton({ invoiceId, invoiceNumber, variant = "ghost", iconOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setLoading(true);
  };

  return (
    <>
      <Button variant={variant} size={iconOnly ? "icon" : "default"} onClick={handleOpen} title="Vorschau">
        <Eye className="h-4 w-4" />
        {!iconOnly && <span className="ml-2">Vorschau</span>}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-lg w-full max-w-4xl flex flex-col"
            style={{ height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <span className="font-medium text-gray-800">
                {invoiceNumber ? `Rechnung ${invoiceNumber}` : "Rechnungsvorschau"}
              </span>
              <div className="flex items-center gap-2">
                <a href={`/api/rechnungen/${invoiceId}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    PDF herunterladen
                  </Button>
                </a>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden rounded-b-lg">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-gray-500">PDF wird geladen...</span>
                </div>
              )}
              <iframe
                key={invoiceId}
                src={`/api/rechnungen/${invoiceId}/pdf?inline=true`}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                title="Rechnungsvorschau"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
