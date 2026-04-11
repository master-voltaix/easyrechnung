import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/session-provider";
import { LanguageProvider } from "@/components/language-provider";
import type { Language } from "@/lib/translations";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuickBill - Rechnungsverwaltung",
  description: "Professionelle Rechnungssoftware für kleine Unternehmen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const rawLang = cookieStore.get("qb-lang")?.value ?? "de";
  const initialLanguage: Language = rawLang === "en" ? "en" : "de";

  return (
    <html lang={initialLanguage}>
      <body
        className={`${bricolageGrotesque.variable} ${instrumentSans.variable} ${ibmPlexMono.variable}`}
      >
        <SessionProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            {children}
            <Toaster />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
