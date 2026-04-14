// Modern invoice HTML template for PDF generation via puppeteer.
import { TemplateSettings, MODERN_DEFAULTS, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/template-settings";
import { InvoiceData } from "./invoice-pdf-template";

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

export function generateModernInvoiceHtml(data: InvoiceData, settings?: TemplateSettings): string {
  const s = settings ?? MODERN_DEFAULTS;
  const color = s.primaryColor;
  const textOnAccent = getContrastColor(color);
  const logoH = LOGO_HEIGHT[s.logoSize];
  const logoW = LOGO_WIDTH[s.logoSize];
  const font = s.fontFamily;
  const fontScale = s.fontSize === "small" ? 0.88 : s.fontSize === "large" ? 1.17 : 1.0;
  const fs = (n: number) => Math.round(n * fontScale);

  // spacing-based values
  const headerPadV =
    s.spacing === "compact" ? "8mm" : s.spacing === "spacious" ? "14mm" : "10mm";
  const headerPadH =
    s.spacing === "compact" ? "18mm" : s.spacing === "spacious" ? "22mm" : "20mm";
  const cellPad =
    s.spacing === "compact" ? "4px 8px" : s.spacing === "spacious" ? "8px 12px" : "6px 10px";
  const sectionGap =
    s.spacing === "compact" ? "5mm" : s.spacing === "spacious" ? "10mm" : "7mm";

  const logoImg = data.company.logoBase64
    ? `<img src="data:${data.company.logoMimeType ?? "image/png"};base64,${data.company.logoBase64}" alt="Logo" style="max-height:${logoH}px; max-width:${logoW}px; object-fit:contain; display:block;" />`
    : "";

  const companyAddressLines = [
    data.company.street,
    [data.company.postalCode, data.company.city].filter(Boolean).join(" "),
    data.company.phone ? `Tel: ${data.company.phone}` : null,
    data.company.email ? `E-Mail: ${data.company.email}` : null,
  ]
    .filter(Boolean)
    .join("<br>");

  const recipientAddress = [
    data.customer.companyName,
    data.customer.contactPerson,
    data.customer.street,
    [data.customer.postalCode, data.customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join("<br>");

  const itemRows = data.items
    .map((item, idx) => {
      const gross = item.lineTotalNet * (1 + item.vatRate / 100);
      const isEven = idx % 2 === 1;
      const rowBg =
        s.tableStyle === "striped" && isEven ? "background:#f9fafb;" : "";
      const borderBottom = "border-bottom:1px solid #f3f4f6;";
      return `
      <tr style="${rowBg}">
        <td style="padding:${cellPad}; ${borderBottom} vertical-align:top;">
          <div style="font-weight:600; font-size:${fs(11)}px; color:#111827;">${item.title}</div>
          ${item.description ? `<div style="font-size:${fs(10)}px; color:#6b7280; margin-top:2px;">${item.description}</div>` : ""}
        </td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-size:${fs(11)}px; color:#374151;">${formatQty(item.quantity)} ${item.unit}</td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-size:${fs(11)}px; color:#374151;">${formatEuro(item.unitPrice)}</td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-size:${fs(11)}px; color:#374151;">${item.vatRate.toFixed(0)} %</td>
        <td style="padding:${cellPad}; ${borderBottom} text-align:right; font-weight:600; font-size:${fs(11)}px; color:#111827;">${formatEuro(gross)}</td>
      </tr>
    `;
    })
    .join("");

  const vatGroupRows = data.vatGroups
    .map(
      (g) => `
    <tr>
      <td style="padding:3px 0; color:#6b7280; text-align:right; padding-right:20px; font-size:${fs(11)}px;">USt. (${g.rate.toFixed(0)} %)</td>
      <td style="padding:3px 0; text-align:right; min-width:100px; font-size:${fs(11)}px;">${formatEuro(g.amount)}</td>
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
      color: #374151;
      background: white;
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
    }
    .content {
      padding-bottom: 32mm;
    }
    table { width: 100%; border-collapse: collapse; }
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 4mm 20mm 5mm 20mm;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      background: white;
    }
    .footer-col { font-size: ${fs(9)}px; line-height: 1.6; color: #6b7280; width: 32%; }
    .footer-col strong { color: #374151; font-weight: 600; }
  </style>
</head>
<body>
  <div class="page">
  <div class="content">

    <!-- Top accent bar -->
    <div style="height:6px; background:${color}; width:100%;"></div>

    <!-- Header: Company info left, Logo right -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:${headerPadV} ${headerPadH}; margin-bottom:0;">
      <div>
        <div style="font-size:${fs(20)}px; font-weight:700; color:${color}; letter-spacing:-0.5px; margin-bottom:4px;">
          ${data.company.companyName}
        </div>
        <div style="font-size:${fs(10)}px; line-height:1.6; color:#6b7280;">
          ${companyAddressLines}
        </div>
      </div>
      <div style="flex-shrink:0;">
        ${logoImg}
      </div>
    </div>

    <!-- Info band -->
    <div style="background:#f9fafb; padding:5mm ${headerPadH}; border-top:2px solid ${color}; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:${sectionGap};">
      <!-- Recipient address -->
      <div style="width:50%;">
        <div style="font-size:${fs(9)}px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Rechnungsempfänger</div>
        <div style="font-size:${fs(12)}px; line-height:1.6; color:#111827;">
          ${recipientAddress}
        </div>
        ${data.customer.vatId ? `<div style="font-size:${fs(10)}px; color:#6b7280; margin-top:4px;">USt-ID: ${data.customer.vatId}</div>` : ""}
      </div>
      <!-- Invoice meta -->
      <div style="text-align:right; width:44%;">
        <div style="font-size:${fs(10)}px; color:${color}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:2px;">Rechnung</div>
        <div style="font-size:${fs(18)}px; font-weight:700; color:#111827; margin-bottom:8px;">${data.invoiceNumber}</div>
        <div style="font-size:${fs(10)}px; line-height:1.8; color:#6b7280;">
          <div><span style="color:#374151; font-weight:500;">Datum:</span> ${data.issueDate}</div>
          ${data.dueDate ? `<div><span style="color:#374151; font-weight:500;">Fällig:</span> ${data.dueDate}</div>` : ""}
          ${data.serviceDate ? `<div><span style="color:#374151; font-weight:500;">Leistungsdatum:</span> ${data.serviceDate}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- Intro text -->
    <div style="padding:0 ${headerPadH}; margin-bottom:${sectionGap}; font-size:${(11.5 * fontScale).toFixed(1)}px; line-height:1.6; color:#374151;">
      Sehr geehrte Damen und Herren,<br>
      hiermit stellen wir Ihnen folgende Leistung in Rechnung:
    </div>

    <!-- Items table -->
    <div style="padding:0 ${headerPadH}; margin-bottom:${sectionGap};">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:${color}; color:${textOnAccent};">
            <th style="padding:8px 10px; text-align:left; font-size:${fs(10)}px; font-weight:600; width:40%;">Beschreibung</th>
            <th style="padding:8px 10px; text-align:right; font-size:${fs(10)}px; font-weight:600;">Menge</th>
            <th style="padding:8px 10px; text-align:right; font-size:${fs(10)}px; font-weight:600;">Einzelpreis</th>
            <th style="padding:8px 10px; text-align:right; font-size:${fs(10)}px; font-weight:600;">MwSt.</th>
            <th style="padding:8px 10px; text-align:right; font-size:${fs(10)}px; font-weight:600;">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:0 ${headerPadH}; display:flex; justify-content:flex-end; margin-bottom:${sectionGap};">
      <table style="border-collapse:collapse; min-width:260px;">
        <tr>
          <td style="padding:3px 0; color:#6b7280; text-align:right; padding-right:20px; font-size:${fs(11)}px;">Gesamt (exkl. MwSt.)</td>
          <td style="padding:3px 0; text-align:right; font-size:${fs(11)}px; min-width:100px;">${formatEuro(data.subtotalNet)}</td>
        </tr>
        ${vatGroupRows}
        <tr>
          <td colspan="2" style="padding-top:6px;">
            <div style="border-left:3px solid ${color}; padding-left:12px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; font-size:${fs(13)}px; color:#111827;">Gesamtbetrag</span>
              <span style="font-weight:700; font-size:${fs(15)}px; color:${color}; margin-left:24px;">${formatEuro(data.totalGross)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Separator -->
    <div style="padding:0 ${headerPadH}; margin-bottom:4mm;">
      <div style="border-top:1px solid #e5e7eb;"></div>
    </div>

    <!-- Payment text -->
    ${
      data.dueDate
        ? `<div style="padding:0 ${headerPadH}; margin-bottom:3mm; font-size:${fs(11)}px; line-height:1.6; color:#374151;">
      Bitte überweisen Sie den Rechnungsbetrag innerhalb von ${paymentDays} Tagen auf unser unten genanntes Konto.
      Für weitere Fragen stehen wir Ihnen sehr gerne zur Verfügung.
    </div>`
        : ""
    }

    <!-- Custom note -->
    ${data.customNote ? `<div style="padding:0 ${headerPadH}; margin-bottom:3mm; font-size:${fs(10)}px; line-height:1.5; color:#6b7280;">${data.customNote}</div>` : ""}

    <!-- Closing -->
    <div style="padding:0 ${headerPadH}; font-size:${fs(11)}px; line-height:1.8; color:#374151;">
      Vielen Dank für die gute Zusammenarbeit.<br>
      Mit freundlichen Grüßen,<br>
      <strong style="color:#111827;">${data.company.companyName}</strong>
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
