# Push-Erinnerungen (Cloudflare-Worker `aufwind-push`)

Aufbau:
- **App** (`js/reminders.js`): meldet das Gerät beim Push-Dienst des Browsers an und schickt Abo, Zeitzone, Vornamen und Erinnerungszeiten an `/api/push`. Erledigte Challenges meldet sie ebenfalls.
- **Pages Function** `functions/api/push.js`: speichert das im KV `AUFWIND_SYNC` (Geheimnis nur als SHA-256, nur bekannte Push-Dienste).
- **Worker** `push/worker.js`: läuft alle 5 Minuten, schickt fällige Erinnerungen (bis 60 Min nach der Uhrzeit, je Tag und Tageszeit einmal), lässt Erledigtes aus, löscht abgelaufene Abos.
- Verschlüsselung/Anmeldung: `push/webpush.js` (VAPID + aes128gcm, nur WebCrypto, gegen RFC 8291 getestet).

## Einrichtung (einmalig, im Cloudflare-Konto des Aufwind-Pages-Projekts)

1. Anmelden: `npx wrangler login`
2. KV-ID suchen: `npx wrangler kv namespace list` → ID des Namespace hinter der Pages-Bindung `AUFWIND_SYNC` in `push/wrangler.toml` bei `id` eintragen.
3. Schlüssel + Worker: `node push/setup-vapid.mjs` – trägt den öffentlichen Schlüssel in `push/wrangler.toml` und `js/push-config.js` ein, veröffentlicht den Worker und setzt den privaten Schlüssel als Secret `VAPID_PRIVATE` (wird nirgends gespeichert).
4. App neu veröffentlichen (Push auf `main`), damit `js/push-config.js` mit dem Schlüssel live geht.
5. In der App: Profil → Erinnerungen → „Push-Erinnerung zur Erinnerungszeit“ einschalten.

Neuen Schlüssel erzeugen (z. B. nach Verlust) = Schritt 3 wiederholen; alle Geräte müssen Push danach einmal aus- und wieder einschalten.
