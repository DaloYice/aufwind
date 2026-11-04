// Erzeugt das VAPID-Schlüsselpaar für die Push-Erinnerungen – einmalig.
//   node push/setup-vapid.mjs
// Ablauf: öffentlichen Schlüssel in push/wrangler.toml und js/push-config.js eintragen → Worker veröffentlichen →
// privaten Schlüssel direkt an `wrangler secret put VAPID_PRIVATE` übergeben (wird nirgends gespeichert oder angezeigt).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const b64u = (buf) => Buffer.from(buf).toString('base64url');

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = b64u(await crypto.subtle.exportKey('raw', pair.publicKey));
const priv = (await crypto.subtle.exportKey('jwk', pair.privateKey)).d;

const run = (args, input) => spawnSync('npx', ['wrangler', ...args], { cwd: here, input, stdio: [input ? 'pipe' : 'inherit', 'inherit', 'inherit'], shell: process.platform === 'win32' });

// 1. Öffentlichen Schlüssel eintragen
const toml = join(here, 'wrangler.toml');
const tomlText = readFileSync(toml, 'utf8');
if (tomlText.includes('KV_NAMESPACE_ID_EINTRAGEN')) {
  console.error('Bitte zuerst die KV-ID in push/wrangler.toml eintragen (npx wrangler kv namespace list).');
  process.exit(1);
}
writeFileSync(toml, tomlText.replace(/VAPID_PUBLIC = ".*"/, `VAPID_PUBLIC = "${pub}"`));
const cfg = join(here, '..', 'js', 'push-config.js');
writeFileSync(cfg, readFileSync(cfg, 'utf8').replace(/export const VAPID_PUBLIC = '.*';/, `export const VAPID_PUBLIC = '${pub}';`));

// 2. Worker veröffentlichen (danach existiert er, und das Secret lässt sich ohne Rückfrage setzen)
if (run(['deploy']).status !== 0) { console.error('\nVeröffentlichen fehlgeschlagen (bei Cloudflare angemeldet? `npx wrangler login`).'); process.exit(1); }

// 3. Privaten Schlüssel als Secret setzen – wird nur über die Standardeingabe weitergereicht
if (run(['secret', 'put', 'VAPID_PRIVATE'], priv).status !== 0) { console.error('\nSecret konnte nicht gesetzt werden.'); process.exit(1); }

console.log('\nFertig. Öffentlicher Schlüssel (in push/wrangler.toml und js/push-config.js eingetragen):\n' + pub);
