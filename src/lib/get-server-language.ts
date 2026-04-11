import { cookies } from "next/headers";
import { translations, type Language, type Translations } from "@/lib/translations";

export function getServerLanguage(): { lang: Language; t: Translations } {
  const cookieStore = cookies();
  const lang = (cookieStore.get("qb-lang")?.value ?? "de") as Language;
  const validLang: Language = lang === "en" ? "en" : "de";
  return { lang: validLang, t: translations[validLang] };
}
