import { InvoiceData } from "./invoice-pdf-template";

interface XRechnungGeneratorOptions {
  validate?: boolean;
}

/**
 * Generates XRechnung (EN 16931:2017 / ZUGFeRD) compliant XML
 * Based on UBL 2.1 specification
 */
export function generateXRechnung(
  data: InvoiceData,
  options: XRechnungGeneratorOptions = {}
): string {
  const { validate = true } = options;

  console.log("[generateXRechnung] Starting generation with data:", {
    invoiceNumber: data.invoiceNumber,
    companyVatId: data.company.vatId,
    customerName: data.customer.companyName,
    itemsCount: data.items.length,
  });

  // Validate required fields for compliance
  if (validate) {
    const errors: string[] = [];
    if (!data.company.vatId) errors.push("Firma Umsatzsteuer-ID ist erforderlich");
    if (!data.invoiceNumber) errors.push("Rechnungsnummer ist erforderlich");
    if (!data.issueDate) errors.push("Ausstellungsdatum ist erforderlich");
    if (!data.customer.companyName) errors.push("Kundenfirmenname ist erforderlich");

    if (errors.length > 0) {
      console.error("[generateXRechnung] Validation failed:", errors);
      throw new Error(`XRechnung Validierungsfehler:\n${errors.join("\n")}`);
    }
  }

  const now = new Date().toISOString();
  const issueDate = new Date(data.issueDate).toISOString().split("T")[0];
  const dueDate = data.dueDate
    ? new Date(data.dueDate).toISOString().split("T")[0]
    : null;

  // Build invoice lines
  const invoiceLines = data.items
    .map((item, index) => {
      const gross = item.lineTotalNet * (1 + item.vatRate / 100);
      return `
    <InvoiceLine>
      <ID>${index + 1}</ID>
      <Note>${escapeXml(item.description || "")}</Note>
      <InvoicedQuantity unitCode="C62">${formatDecimal(item.quantity)}</InvoicedQuantity>
      <LineExtensionAmount currencyID="EUR">${formatDecimal(item.lineTotalNet)}</LineExtensionAmount>
      <Item>
        <Name>${escapeXml(item.title)}</Name>
        <Description>${escapeXml(item.description || "")}</Description>
      </Item>
      <Price>
        <PriceAmount currencyID="EUR">${formatDecimal(item.unitPrice)}</PriceAmount>
      </Price>
      <TaxTotal>
        <TaxAmount currencyID="EUR">${formatDecimal(gross - item.lineTotalNet)}</TaxAmount>
        <TaxSubtotal>
          <TaxableAmount currencyID="EUR">${formatDecimal(item.lineTotalNet)}</TaxableAmount>
          <TaxAmount currencyID="EUR">${formatDecimal(gross - item.lineTotalNet)}</TaxAmount>
          <TaxCategory>
            <ID>${item.vatRate.toFixed(0)}</ID>
            <Percent>${item.vatRate.toFixed(2)}</Percent>
            <TaxScheme>
              <ID>VAT</ID>
            </TaxScheme>
          </TaxCategory>
        </TaxSubtotal>
      </TaxTotal>
    </InvoiceLine>`;
    })
    .join("");

  // Build VAT breakdown
  const vatBreakdown = data.vatGroups
    .map(
      (group) => `
    <TaxSubtotal>
      <TaxableAmount currencyID="EUR">${formatDecimal(
        data.subtotalNet * (group.rate / 100)
      )}</TaxableAmount>
      <TaxAmount currencyID="EUR">${formatDecimal(group.amount)}</TaxAmount>
      <TaxCategory>
        <ID>${group.rate.toFixed(0)}</ID>
        <Percent>${group.rate.toFixed(2)}</Percent>
        <TaxScheme>
          <ID>VAT</ID>
        </TaxScheme>
      </TaxCategory>
    </TaxSubtotal>`
    )
    .join("");

  // Build payment terms if due date exists
  const paymentTermsXml = dueDate
    ? `
  <PaymentTerms>
    <Note>Zahlbar bis ${dueDate}</Note>
  </PaymentTerms>`
    : "";

  // Build bank account info
  const bankAccountXml = data.company.iban
    ? `
    <FinancialAccount>
      <ID>${data.company.iban}</ID>
      ${data.company.bic ? `<Name>${escapeXml(data.company.bankName || "")}</Name>` : ""}
    </FinancialAccount>`
    : "";

  const paymentMeansXml = data.company.iban
    ? `
  <PaymentMeans>
    <PaymentMeansCode>30</PaymentMeansCode>
    <PaymentChannelCode>IBAN</PaymentChannelCode>
    <PayeeFinancialAccount>${bankAccountXml}
    </PayeeFinancialAccount>
  </PaymentMeans>`
    : "";

  // Build XML document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:roles:e-invoice:spec:3.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate || issueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  ${data.customNote ? `<cbc:Note>${escapeXml(data.customNote)}</cbc:Note>` : ""}

  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>

  <!-- Supplier -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0088">${escapeXml(data.company.vatId || "")}</cbc:EndpointID>
      <cac:PartyIdentification>
        <cbc:ID>${escapeXml(data.company.vatId || "")}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(data.company.companyName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data.company.street || "")}</cbc:StreetName>
        <cbc:CityName>${escapeXml(data.company.city || "")}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(data.company.postalCode || "")}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data.company.vatId || "")}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data.company.companyName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      ${
        data.company.email
          ? `<cac:Contact>
        <cbc:ElectronicMail>${escapeXml(data.company.email)}</cbc:ElectronicMail>
      </cac:Contact>`
          : ""
      }
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Customer -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${
        data.customer.vatId
          ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data.customer.vatId)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`
          : ""
      }
      <cac:PartyName>
        <cbc:Name>${escapeXml(data.customer.companyName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data.customer.street || "")}</cbc:StreetName>
        <cbc:CityName>${escapeXml(data.customer.city || "")}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(data.customer.postalCode || "")}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data.customer.companyName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Delivery -->
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${issueDate}</cbc:ActualDeliveryDate>
  </cac:Delivery>

  ${paymentMeansXml}
  ${paymentTermsXml}

  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${formatDecimal(data.totalVat)}</cbc:TaxAmount>
    ${vatBreakdown}
  </cac:TaxTotal>

  <!-- Document Totals -->
  <cac:DocumentTotals>
    <cbc:LineExtensionAmount currencyID="EUR">${formatDecimal(data.subtotalNet)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${formatDecimal(data.subtotalNet)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${formatDecimal(data.totalGross)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="EUR">0.00</cbc:AllowanceTotalAmount>
    <cbc:PrepaidAmount currencyID="EUR">0.00</cbc:PrepaidAmount>
    <cbc:PayableAmount currencyID="EUR">${formatDecimal(data.totalGross)}</cbc:PayableAmount>
  </cac:DocumentTotals>

  <!-- Invoice Lines -->
  ${invoiceLines}

</Invoice>`;

  console.log("[generateXRechnung] XML generation completed successfully, length:", xml.length);
  return xml;
}

/**
 * Escapes special XML characters
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats decimal numbers for XML (always 2 decimal places)
 */
function formatDecimal(value: number): string {
  return value.toFixed(2).replace(",", ".");
}
