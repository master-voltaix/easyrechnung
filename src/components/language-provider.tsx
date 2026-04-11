"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language, type Translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "de",
  t: translations.de,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  // Keep in sync if settings change in another tab
  useEffect(() => {
    const onStorage = () => {
      try {
        const raw = localStorage.getItem("qb-settings");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.language && parsed.language !== language) {
            setLanguage(parsed.language as Language);
          }
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}
