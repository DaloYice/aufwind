# Aufwind – Fitness für jeden Einstieg

Lokale Fitness-PWA für mich und die Familie. Holt jeden Fitnessstand ab – auch stark übergewichtige Einsteiger – mit kleinen Daily Challenges morgens und abends.

## Online
https://aufwind-4er.pages.dev/ (Cloudflare Pages, Auto-Deploy bei Push auf `main` – jeder Push ist sofort live)

## Starten (lokal)
- Doppelklick auf `start.bat` (öffnet http://localhost:8080) – oder `npm start`
- Im Browser über das Install-Symbol als App installieren
- Tests: `npm test` (läuft auch per GitHub Actions bei jedem Push)
- Browser-Smoke-Test: `node tools/smoke.mjs . <ausgabeordner> [breite]` · Figuren-Vorschau: `tools/figures.html`

## Funktionen
- **Einstieg für jeden:** Einstufungstest (Gehdauer, Aufstehen vom Stuhl, Treppen, Gelenke, Aktivität, BMI, Gesundheits-Check) → Level 1–5
- **Motivation:** persönliches „Warum“, Wenn-dann-Plan („Nach dem Zähneputzen …“), Wochenziel mit Rückblick jeden Montag
- **Daily Challenges** morgens und abends, pro Tag stabil, Level- und Feedback-angepasst
- **Geführter Player** mit animierter Strichfigur, Timer, Signaltönen, Sprachansage und Wake-Lock
- **Programme:** Geh-Start (8 Wo. → 15 Min am Stück), Gehen 30 (8 Wo. → 30 Min), Kraft-Basis (6 Wo.)
- **Übungsbibliothek** (34 Übungen) mit Figur, Anleitung, Tipp, leichter/schwerer Variante
- **Alltag:** Gewohnheit des Tages, Wasser-Zähler, „Wusstest du?“-Tipps
- **Familie:** mehrere Profile, gemeinsame Familien-Challenge (Minuten pro Woche)
- **Dashboard:** Kennzahlen, Wochenminuten mit WHO-Linie, Aktivitätskalender, Gewichtsverlauf, Schwerpunkte, starke Wochentage, Gefühl-Verteilung – mit Tooltips und Tabellenansicht
- Serie mit Joker, 23 Abzeichen, Level-Vorschläge, Messwerte (Gewicht, Bauch, Hüfte, Schritte)
- Erinnerungen per Benachrichtigung (solange die App offen ist) und als Kalender-Datei (.ics), JSON-Sicherung
- **Handy & PC verbinden:** Sync-Code (mit QR), Ende-zu-Ende verschlüsselt (AES-GCM), Cloudflare Pages Function + Workers KV, Stände werden zusammengeführt

## Sync einrichten (einmalig, Cloudflare)
1. Cloudflare → Storage & databases → Workers KV → Namespace `aufwind-sync` anlegen
2. Workers & Pages → aufwind → Settings → Bindings → KV namespace: Variablenname `AUFWIND_SYNC`, Namespace `aufwind-sync`
3. Neu deployen (Push oder „Retry deployment“)

Lokal emuliert `server.mjs` den Speicher im Arbeitsspeicher. Test mit zwei Geräten: `node tools/sync-smoke.mjs . <ausgabeordner>`.

## Technik
Vanilla JS (ES-Module), kein Build-Step, keine npm-Abhängigkeiten. Schrift Nunito (OFL, lokal in `fonts/`), QR-Codes mit qrcode-generator (MIT, `vendor/`). Daten in `localStorage`. Service Worker (Network-First).

> Hinweis: Für Installation/Offline auf dem Handy braucht es HTTPS (oder localhost). Im WLAN per `http://<PC-IP>:8080` läuft die App, aber ohne Installation/Offline.
