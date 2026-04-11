export type FontFamily = "Helvetica Neue" | "Georgia" | "Arial";
export type LogoSize = "small" | "medium" | "large";
export type Spacing = "compact" | "normal" | "spacious";
export type TableStyle = "default" | "striped" | "minimal";

export interface TemplateSettings {
  primaryColor: string;
  textColor: string;
  accentTextColor: string;
  fontFamily: FontFamily;
  logoSize: LogoSize;
  spacing: Spacing;
  tableStyle: TableStyle;
}

export const LOGO_HEIGHT: Record<LogoSize, number> = { small: 55, medium: 85, large: 115 };
export const LOGO_WIDTH: Record<LogoSize, number> = { small: 150, medium: 230, large: 290 };

export const CLASSIC_DEFAULTS: TemplateSettings = {
  primaryColor: "#1f2937",
  textColor: "#1f2937",
  accentTextColor: "#ffffff",
  fontFamily: "Helvetica Neue",
  logoSize: "medium",
  spacing: "normal",
  tableStyle: "default",
};

// Keep for backward compat with existing saved modern templates
export const MODERN_DEFAULTS: TemplateSettings = {
  primaryColor: "#2563eb",
  textColor: "#1f2937",
  accentTextColor: "#ffffff",
  fontFamily: "Arial",
  logoSize: "medium",
  spacing: "normal",
  tableStyle: "minimal",
};

export function getDefaults(key: string): TemplateSettings {
  return key === "modern" ? { ...MODERN_DEFAULTS } : { ...CLASSIC_DEFAULTS };
}
