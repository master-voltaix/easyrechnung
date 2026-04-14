// This file contains the HTML template for PDF generation via puppeteer.
// It exports a function that generates an HTML string with inline styles.

import { TemplateSettings, CLASSIC_DEFAULTS, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/template-settings";

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  serviceDate?: string | null;
  customNote?: string | null;
  paymentDays?: number | null;
  customer: {
    companyName: string;
    contactPerson?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    vatId?: string | null;
  };
  company: {
    companyName: string;
    ownerName?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    vatId?: string | null;
    taxNumber?: string | null;
    iban?: string | null;
    bic?: string | null;
    bankName?: string | null;
    accountHolder?: string | null;
    logoBase64?: string | null;
    logoMimeType?: string | null;
  };
  items: {
    title: string;
    description?: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    lineTotalNet: number;
  }[];
  subtotalNet: number;
  totalVat: number;
  totalGross: number;
  vatGroups: { rate: number; amount: number }[];
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatQty(qty: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(qty);
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function generateInvoiceHtml(data: InvoiceData, settings?: TemplateSettings): string {
  const s = settings ?? CLASSIC_DEFAULTS;
  const color = s.primaryColor;
  const bodyTextColor = s.textColor ?? "#1f2937";
  const textOnAccent = s.accentTextColor ?? getContrastColor(color);
  const logoH = LOGO_HEIGHT[s.logoSize];
  const logoW = LOGO_WIDTH[s.logoSize];
  const font = s.fontFamily;
  const fontScale = s.fontSize === "small" ? 0.88 : s.fontSize === "large" ? 1.17 : 1.0;
  const fs = (n: number) => Math.round(n * fontScale);

  // spacing-based values
  const pagePad =
    s.spacing === "compact"
      ? "12mm 18mm 0 18mm"
      : s.spacing === "spacious"
      ? "18mm 22mm 0 22mm"
      : "15mm 20mm 0 20mm";
  const sectionGap =
    s.spacing === "compact" ? "6mm" : s.spacing === "spacious" ? "12mm" : "10mm";
  const cellPad =
    s.spacing === "compact" ? "4px 8px" : s.spacing === "spacious" ? "8px 12px" : "5px 10px";

  const senderLine = [
    data.company.companyName,
    data.company.street,
    [data.company.postalCode, data.company.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const recipientAddress = [
    data.customer.companyName,
    data.customer.contactPerson,
    data.customer.street,
    [data.customer.postalCode, data.customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join("<br>");

  const logoImg = data.company.logoBase64
    ? `<div class="logo-box"><img src="data:${data.company.logoMimeType ?? "image/png"};base64,${data.company.logoBase64}" alt="Logo" style="max-height:${logoH}px; max-width:${logoW}px; object-fit:contain;" /></div>`
    : "";

  const itemRows = data.items
    .map((item, idx) => {
      const gross = item.lineTotalNet * (1 + item.vatRate / 100);
      const isEven = idx % 2 === 1;
      const rowBg =
        s.tableStyle === "striped" && isEven ? "background:#f9fafb;" : "";
      const borderBottom =
        s.tableStyle === "minimal" ? "border-bottom:1px solid #f3f4f6;" : "border-bottom:1px solid #e5e7eb;";
      return `
      <tr style="${rowBg}">
        <td style="${cellPad ? `padding:${cellPad};` : ""}${borderBottom} vertical-align:top;">
          <div style="font-weight:500; font-size:${fs(11)}px;">${item.title}</div>
          ${item.description ? `<div style="font-size:${fs(10)}px; color:#6b7280; margin-top:1px;">${item.description}</div>` : ""}
        </td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-size:${fs(11)}px;">${formatQty(item.quantity)} ${item.unit}</td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-size:${fs(11)}px;">${formatEuro(item.unitPrice)}</td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-size:${fs(11)}px;">${item.vatRate.toFixed(0)} %</td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-weight:500; font-size:${fs(11)}px;">${formatEuro(gross)}</td>
      </tr>
    `;
    })
    .join("");

  const vatGroupRows = data.vatGroups
    .map(
      (g) => `
    <tr>
      <td style="padding:4px 0; color:#6b7280; text-align:right; padding-right:20px;">USt. (${g.rate.toFixed(0)} %)</td>
      <td style="padding:4px 0; text-align:right; min-width:100px;">${formatEuro(g.amount)}</td>
    </tr>
  `
    )
    .join("");

  const paymentDays = data.paymentDays ?? 14;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rechnung ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: '${font}', Helvetica, Arial, sans-serif;
      font-size: ${fs(12)}px;
      color: ${bodyTextColor};
      background: white;
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      padding: ${pagePad};
      position: relative;
      box-sizing: border-box;
    }
    .content {
      padding-bottom: 32mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: ${sectionGap};
    }
    .header-title {
      font-size: ${fs(26)}px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #111827;
    }
    .address-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6mm;
    }
    .recipient-block { width: 55%; }
    .sender-line {
      font-size: ${fs(9)}px;
      color: #9ca3af;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .recipient-address { font-size: ${fs(12)}px; line-height: 1.5; }
    .info-block { width: 42%; text-align: right; }
    .info-block-company { font-size: ${fs(11)}px; line-height: 1.5; margin-bottom: 5px; color: #374151; }
    .invoice-meta { font-size: ${fs(11)}px; line-height: 1.7; }
    .invoice-meta strong { font-weight: 700; }
    .intro-text { margin-bottom: 5mm; font-size: ${fs(12)}px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
    .table-header { background-color: ${color}; color: ${textOnAccent}; }
    .table-header th { padding: 7px 10px; text-align: left; font-size: ${fs(11)}px; font-weight: 600; }
    .table-header th:not(:first-child) { text-align: right; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 5mm; }
    .totals-table { border-collapse: collapse; }
    .totals-table td { padding: 3px 0; font-size: ${fs(11)}px; }
    .totals-table td:first-child { color: #6b7280; text-align: right; padding-right: 20px; min-width: 180px; }
    .totals-table td:last-child { text-align: right; min-width: 100px; }
    .total-final td { font-weight: 700; font-size: ${fs(13)}px; border-top: 2px solid ${color}; padding-top: 6px !important; }
    .separator { border: none; border-top: 1px solid #e5e7eb; margin: 3mm 0; }
    .payment-text { font-size: ${fs(11)}px; line-height: 1.5; margin-bottom: 3mm; }
    .custom-note { font-size: ${fs(10)}px; line-height: 1.5; color: #6b7280; margin-bottom: 3mm; }
    .closing { font-size: ${fs(11)}px; line-height: 1.7; }
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4mm 20mm 5mm 20mm;
      border-top: 1px solid #9ca3af;
      display: flex;
      justify-content: space-between;
      background: white;
    }
    .footer-col { font-size: ${fs(9)}px; line-height: 1.6; color: #6b7280; width: 32%; }
    .footer-col strong { color: #374151; font-weight: 600; }
    .logo-box { padding: 8px 12px; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="page">
  <div class="content">
    <!-- Header: RECHNUNG + Logo -->
    <div class="header">
      <div class="header-title">RECHNUNG</div>
      <div>${logoImg}</div>
    </div>

    <!-- Address section -->
    <div class="address-section">
      <div class="recipient-block">
        <div class="sender-line">${senderLine}</div>
        <div class="recipient-address">${recipientAddress}</div>
      </div>
      <div class="info-block">
        <div class="info-block-company">
          ${data.company.companyName}<br>
          ${data.company.street ?? ""}<br>
          ${[data.company.postalCode, data.company.city].filter(Boolean).join(" ")}
        </div>
        <div class="invoice-meta">
          <strong>Rechnungsnummer:</strong> ${data.invoiceNumber}<br>
          <strong>Ausstellungsdatum:</strong> ${data.issueDate}<br>
          ${data.dueDate ? `<strong>Fälligkeitsdatum:</strong> ${data.dueDate}<br>` : ""}
          ${data.serviceDate ? `<strong>Leistungsdatum:</strong> ${data.serviceDate}<br>` : ""}
        </div>
      </div>
    </div>

    <!-- Intro -->
    <div class="intro-text">
      Sehr geehrte Damen und Herren,<br>
      hiermit stellen wir Ihnen folgende Leistung in Rechnung:
    </div>

    <!-- Items table -->
    <table>
      <thead class="table-header">
        <tr>
          <th style="width:40%;">Beschreibung</th>
          <th style="text-align:right;">Menge</th>
          <th style="text-align:right;">Preis pro Einheit</th>
          <th style="text-align:right;">MwSt. (%)</th>
          <th style="text-align:right;">Gesamt (inkl. MwSt.)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Gesamt (exkl. MwSt.)</td>
          <td>${formatEuro(data.subtotalNet)}</td>
        </tr>
        ${vatGroupRows}
        <tr class="total-final">
          <td>Gesamt</td>
          <td>${formatEuro(data.totalGross)}</td>
        </tr>
      </table>
    </div>

    <hr class="separator">

    <!-- Payment text -->
    ${
      data.dueDate
        ? `
    <div class="payment-text">
      Bitte überweisen Sie den Rechnungsbetrag innerhalb von ${paymentDays} Tagen auf unser unten genanntes Konto.
      Für weitere Fragen stehen wir Ihnen sehr gerne zur Verfügung.
    </div>
    `
        : ""
    }

    <!-- Custom note -->
    ${data.customNote ? `<div class="custom-note">${data.customNote}</div>` : ""}

    <!-- Closing -->
    <div class="closing">
      Vielen Dank für die gute Zusammenarbeit.<br>
      Mit freundlichen Grüßen,<br>
      ${data.company.companyName}
    </div>

  </div><!-- end .content -->

    <!-- Footer -->
    <div class="footer">
      <div class="footer-col">
        <strong>${data.company.companyName}</strong><br>
        ${data.company.street ?? ""}<br>
        ${[data.company.postalCode, data.company.city].filter(Boolean).join(" ")}<br>
        ${data.company.phone ? `Tel: ${data.company.phone}<br>` : ""}
        ${data.company.email ? `E-Mail: ${data.company.email}` : ""}
      </div>
      <div class="footer-col">
        ${data.company.bankName ? `<strong>${data.company.bankName}</strong><br>` : ""}
        ${data.company.iban ? `IBAN: ${data.company.iban}<br>` : ""}
        ${data.company.bic ? `BIC: ${data.company.bic}<br>` : ""}
        ${data.company.accountHolder ? `Kontoinhaber: ${data.company.accountHolder}` : ""}
      </div>
      <div class="footer-col">
        ${data.company.vatId ? `USt-ID: ${data.company.vatId}<br>` : ""}
        ${data.company.taxNumber ? `Steuernr.: ${data.company.taxNumber}<br>` : ""}
        ${data.company.ownerName ? `Geschäftsführer: ${data.company.ownerName}<br>` : ""}
        ${data.company.website ? `Web: ${data.company.website}` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}
