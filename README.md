# EasyRechnung

Professionelle Rechnungssoftware für Selbstständige und kleine Unternehmen.

## Voraussetzungen

- Node.js 18 oder höher
- PostgreSQL-Datenbank

## Installation und Einrichtung

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Bearbeiten Sie die `.env`-Datei und tragen Sie Ihre Werte ein:

```env
DATABASE_URL="postgresql://benutzername:passwort@localhost:5432/easy_rechnung"
NEXTAUTH_SECRET="ein-langer-zufaelliger-string"
NEXTAUTH_URL="http://localhost:3000"
```

**NEXTAUTH_SECRET** generieren:
```bash
openssl rand -base64 32
```

### 3. Datenbank einrichten

```bash
npx prisma db push
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

### 5. Im Browser öffnen

Öffnen Sie [http://localhost:3000](http://localhost:3000)

## Verfügbare Skripte

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktions-Build erstellen |
| `npm run start` | Produktionsserver starten |
| `npm run db:push` | Datenbankschema anwenden |
| `npm run db:studio` | Prisma Studio öffnen |

## Funktionen

- **Benutzerregistrierung und -anmeldung** mit E-Mail und Passwort
- **Firmenprofil** mit Logo, Bankdaten und Steuerdaten
- **Kundenverwaltung** — Kunden anlegen, bearbeiten und löschen
- **Produktverwaltung** — Wiederkehrende Leistungen als Produkte speichern
- **Rechnungserstellung** — Automatische Rechnungsnummer (RE-JJJJ-XXXX)
- **PDF-Export** — Professionelle Rechnungs-PDFs per Puppeteer
- **Statusverwaltung** — Entwurf → Versendet → Bezahlt / Storniert
- **Dashboard** — Umsatzübersicht und letzte Rechnungen

## PDF-Vorlage

Die PDF-Rechnungen folgen einem professionellen deutschen Layout:
- Briefkopf mit RECHNUNG und Firmenlogo
- Absenderzeile über der Empfängeradresse
- Tabelle mit Beschreibung, Menge, Preis, MwSt. und Gesamtbetrag
- Zusammenfassung mit Nettobetrag, MwSt. und Bruttobetrag
- Fußzeile mit Firmen-, Bank- und Steuerdaten

## Technologie-Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **Prisma** + PostgreSQL
- **NextAuth v4** (Credentials Provider)
- **Puppeteer** (PDF-Generierung)
- **react-hook-form** + **Zod**
