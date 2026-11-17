// Keeps Mikey Mitchell's Lesson Plans working with no internet after the first visit.
// Always tries the internet first (so updates show up right away) and uses the saved copy when offline.
const CACHE = 'mikey-lessons-app-20261117205136';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // The download keeps going even if the saved copy is used, so the next visit is up to date
  const net = fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; });
  e.waitUntil(net.catch(() => {}));
  const slow = new Promise((resolve, reject) => setTimeout(() => reject(new Error('slow')), 4000));
  e.respondWith(
    Promise.race([net, slow]).catch(() =>
      caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : null))
        .then(hit => hit || net))
  );
});
