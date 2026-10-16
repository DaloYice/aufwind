# Aufwind – Fitness für jeden Einstieg

Lokale Fitness-PWA für mich und die Familie. Holt jeden Fitnessstand ab – auch stark übergewichtige Einsteiger – mit kleinen Daily Challenges morgens und abends.

## Starten
- Doppelklick auf `start.bat` (öffnet http://localhost:8080) – oder `npm start`
- Im Browser über das Install-Symbol als App installieren
- Tests: `npm test` · Browser-Smoke-Test: `node tools/smoke.mjs . <ausgabeordner>`

## Funktionen
- Einstufungstest (Gehdauer, Aufstehen vom Stuhl, Treppen, Gelenke, Aktivität, BMI, Gesundheits-Check) → Level 1–5
- Morgen- und Abend-Challenge, pro Tag stabil, Level- und Feedback-angepasst
- Geführter Workout-Player mit Timer, Signaltönen, Sprachansage und Wake-Lock
- Übungsbibliothek (33 Übungen) mit Anleitung, Tipp, leichter/schwerer Variante
- Gewohnheit des Tages (Ernährung/Alltag), „Wusstest du?“-Tipps
- Serie mit Joker (1 verpasster Tag/Woche), 19 Abzeichen, Level-Auf-/Abstiegs-Vorschlag
- Fortschritt: Gewicht, Bauch, Hüfte, Schritte mit Diagramm; Wochenminuten vs. WHO-Ziel
- Mehrere Profile, JSON-Sicherung, Kalender-Erinnerung (.ics)

## Technik
Vanilla JS (ES-Module), kein Build-Step, keine Abhängigkeiten. Daten in `localStorage`. Service Worker (Network-First).

> Hinweis: Für Installation/Offline auf dem Handy braucht es HTTPS (oder localhost). Im WLAN per `http://<PC-IP>:8080` läuft die App, aber ohne Installation/Offline.
