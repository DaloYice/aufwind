// Web Push ohne Abhängigkeiten (läuft im Cloudflare-Worker und in Node ≥ 20, nur WebCrypto):
// - VAPID-Anmeldung (RFC 8292): JWT mit ES256 signiert
// - Inhalt verschlüsselt mit aes128gcm (RFC 8291 / RFC 8188)

const enc = new TextEncoder();

export function b64u(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unb64u(str) {
  const s = atob(String(str).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/** VAPID-Schlüsselpaar aus den Rohwerten: public = 65 Byte (04|x|y), private = 32 Byte (d). */
export async function importVapid(publicB64u, privateB64u) {
  const pub = unb64u(publicB64u);
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), d: privateB64u, ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { publicKey: publicB64u, signKey: key };
}

/** Authorization-Header für einen Push-Dienst (aud = Ursprung des Endpunkts). */
export async function vapidHeader(endpoint, vapid, subject, now = Date.now()) {
  const aud = new URL(endpoint).origin;
  const header = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject })));
  const data = `${header}.${claims}`;
  // WebCrypto liefert die Signatur bereits im JWS-Format (r|s, je 32 Byte)
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.signKey, enc.encode(data));
  return `vapid t=${data}.${b64u(sig)}, k=${vapid.publicKey}`;
}

/**
 * Inhalt für ein Abo verschlüsseln (aes128gcm, ein Datensatz).
 * @param {{p256dh:string, auth:string}} keys  aus der PushSubscription
 * @param {Uint8Array} plaintext
 * @param {{salt?:Uint8Array, serverKeys?:CryptoKeyPair}} [fixed]  nur für Tests (feste Werte aus RFC 8291)
 */
export async function encryptPayload(keys, plaintext, fixed = {}) {
  const uaPublic = unb64u(keys.p256dh);
  const authSecret = unb64u(keys.auth);
  const salt = fixed.salt || crypto.getRandomValues(new Uint8Array(16));
  const server = fixed.serverKeys || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', server.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, server.privateKey, 256));

  const ikm = await hkdf(authSecret, ecdh, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const padded = concat(plaintext, new Uint8Array([2])); // Trennbyte für den letzten Datensatz
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, padded));

  const rs = new Uint8Array([0, 0, 16, 0]); // Datensatzgröße 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

/**
 * Eine Push-Nachricht senden. Ergebnis: { ok, status, gone } – gone = Abo existiert nicht mehr (404/410).
 */
export async function sendPush(subscription, payload, { vapid, subject, ttl = 3600, fetchFn = fetch }) {
  const body = await encryptPayload(subscription.keys, enc.encode(JSON.stringify(payload)));
  const res = await fetchFn(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidHeader(subscription.endpoint, vapid, subject),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: 'normal',
    },
    body,
  });
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
