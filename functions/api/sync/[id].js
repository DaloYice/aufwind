// Cloudflare Pages Function: speichert verschlüsselte Sync-Daten in Workers KV.
// Der Server sieht nur Chiffretext – Schlüssel und Klartext bleiben auf den Geräten.
// Benötigt eine KV-Bindung mit dem Variablennamen AUFWIND_SYNC.
const ID = /^[a-f0-9]{32}$/;
const MAX = 2_000_000;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export async function onRequest({ request, env, params }) {
  const id = String(params.id || '');
  if (!ID.test(id)) return json({ error: 'Ungültige Sync-ID' }, 400);
  const kv = env.AUFWIND_SYNC;
  if (!kv) return json({ error: 'Sync-Speicher ist noch nicht eingerichtet' }, 503);
  const key = `v1:${id}`;

  if (request.method === 'GET') {
    const rec = await kv.get(key, 'json');
    return rec ? json(rec) : json({ error: 'Nicht gefunden' }, 404);
  }

  if (request.method === 'PUT') {
    const text = await request.text();
    if (text.length > MAX) return json({ error: 'Zu groß' }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: 'Ungültiges JSON' }, 400); }
    if (typeof body.data !== 'string' || !Number.isInteger(body.v)) return json({ error: 'Ungültige Daten' }, 400);
    const cur = await kv.get(key, 'json');
    if (cur && cur.v !== body.v) return json({ error: 'Konflikt', ...cur }, 409);
    const rec = { v: (cur?.v || 0) + 1, data: body.data, updatedAt: new Date().toISOString() };
    await kv.put(key, JSON.stringify(rec));
    return json({ v: rec.v, updatedAt: rec.updatedAt });
  }

  if (request.method === 'DELETE') {
    await kv.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'Methode nicht erlaubt' }, 405);
}
