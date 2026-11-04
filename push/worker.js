// Cloudflare-Worker „aufwind-push“: läuft per Cron alle 5 Minuten und verschickt fällige Erinnerungen.
// Abos legt die App über die Pages Function /api/push im selben KV (AUFWIND_SYNC) an:
//   push:<id>                       { h, sub, tz, people:[{pid,name,morning,evening}], at }
//   pushdone:<pid>:<datum>:<slot>   Challenge heute schon erledigt → keine Erinnerung
//   pushsent:<id>:<pid>:<slot>      Datum der letzten Erinnerung (gegen doppelte Nachrichten)
// Secrets: VAPID_PRIVATE (npx wrangler secret put VAPID_PRIVATE). VAPID_PUBLIC steht in wrangler.toml (öffentlich).
import { importVapid, sendPush } from './webpush.js';
import { dueReminders, reminderPayload } from './schedule.js';

const TTL_2_DAYS = 2 * 24 * 3600;

export async function runReminders(env, now = new Date(), fetchFn = fetch) {
  const kv = env.AUFWIND_SYNC;
  if (!kv || !env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return { error: 'nicht eingerichtet' };
  const vapid = await importVapid(env.VAPID_PUBLIC, env.VAPID_PRIVATE);
  const subject = env.VAPID_SUBJECT || 'https://aufwind-4er.pages.dev';
  const stats = { subs: 0, sent: 0, skipped: 0, removed: 0, failed: 0 };
  let cursor;
  do {
    const page = await kv.list({ prefix: 'push:', cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const { name: key } of page.keys) {
      stats.subs++;
      const rec = await kv.get(key, 'json');
      if (!rec?.sub) continue;
      const id = key.slice(5);
      for (const due of dueReminders(rec, now)) {
        const sentKey = `pushsent:${id}:${due.pid}:${due.slot}`;
        if ((await kv.get(sentKey)) === due.date) continue;
        const done = await kv.get(`pushdone:${due.pid}:${due.date}:${due.slot}`);
        if (!done) {
          const r = await sendPush(rec.sub, reminderPayload(due), { vapid, subject, fetchFn });
          if (r.gone) { await kv.delete(key); stats.removed++; break; }
          if (!r.ok) { stats.failed++; continue; } // nächster Lauf versucht es erneut
          stats.sent++;
        } else stats.skipped++;
        await kv.put(sentKey, due.date, { expirationTtl: TTL_2_DAYS });
      }
    }
  } while (cursor);
  return stats;
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runReminders(env).then((s) => console.log('Erinnerungen', JSON.stringify(s))));
  },
  // Kein öffentlicher Endpunkt – nur zur Kontrolle, ob der Worker läuft
  async fetch() {
    return new Response('Aufwind-Erinnerungen laufen per Zeitplan.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};
