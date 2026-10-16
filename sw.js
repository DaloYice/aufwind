// Service Worker: Network-First für App-Dateien (immer aktuell), Cache als Offline-Fallback.
const CACHE = 'aufwind-v2';
const ASSETS = [
  './', './index.html', './css/app.css', './manifest.webmanifest', './icons/icon.svg',
  './js/app.js', './js/store.js', './js/player.js', './js/ui.js', './js/chart.js',
  './js/core/dates.js', './js/core/assessment.js', './js/core/challenges.js', './js/core/progress.js',
  './js/data/exercises.js', './js/data/habits.js', './js/data/poses.js', './js/data/programs.js',
  './js/core/week.js', './js/figure.js', './js/dashboard.js', './js/reminders.js',
  './icons/icon-192.png', './icons/icon-512.png',
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
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
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

// Klick auf eine Erinnerung öffnet bzw. fokussiert die App.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const win = list.find((c) => c.url.startsWith(self.registration.scope));
      return win ? win.focus() : self.clients.openWindow('./#/heute');
    }),
  );
});
