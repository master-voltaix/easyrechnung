import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuro(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  let dateStr: string;

  if (typeof date === "string") {
    // If it's a string, extract just the date part (YYYY-MM-DD)
    dateStr = date.split("T")[0];
  } else {
    // If it's a Date object, use local date (day, month, year) without timezone conversion
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    dateStr = `${year}-${month}-${day}`;
  }

  // Parse the date string and format it as dd.mm.yyyy
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseGermanNumber(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}
