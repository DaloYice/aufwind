// Service Worker: Network-First für App-Dateien (immer aktuell), Cache als Offline-Fallback.
const CACHE = 'aufwind-v13';
const ASSETS = [
  './', './index.html', './css/app.css', './manifest.webmanifest', './icons/icon.svg',
  './js/app.js', './js/store.js', './js/player.js', './js/ui.js', './js/chart.js',
  './js/core/dates.js', './js/core/assessment.js', './js/core/challenges.js', './js/core/progress.js',
  './js/data/exercises.js', './js/data/habits.js', './js/data/poses.js', './js/data/programs.js',
  './js/core/week.js', './js/figure.js', './js/dashboard.js', './js/reminders.js',
  './icons/icon-192.png', './icons/icon-512.png', './js/confetti.js',
  './fonts/nunito-latin.woff2', './fonts/nunito-latin-ext.woff2',
  './js/sync.js', './js/core/syncdata.js', './vendor/qrcode.js', './js/core/records.js', './js/icons.js', './js/core/checkin.js', './js/core/custom.js', './js/core/exlog.js', './js/data/focus.js', './js/data/worlds.js', './js/push-config.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Sync-API nie cachen
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});

// Push-Erinnerung vom Server (push/worker.js) anzeigen
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* leer oder kein JSON */ }
  e.waitUntil(self.registration.showNotification(d.title || 'Aufwind', {
    body: d.body || 'Zeit für deine Challenge.',
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || 'aufwind', renotify: true,
    data: { url: d.url || './#/heute' },
    actions: [{ action: 'start', title: 'Jetzt starten' }],
  }));
});

// Klick auf eine Erinnerung öffnet bzw. fokussiert die App („Jetzt starten“ startet direkt das Fällige).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.action === 'start' ? './#/start' : (e.notification.data?.url || './#/heute');
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const win = list.find((c) => c.url.startsWith(self.registration.scope));
      if (!win) return self.clients.openWindow(target);
      return win.focus().then((w) => (w && 'navigate' in w ? w.navigate(new URL(target, self.registration.scope).href) : w));
    }),
  );
});
