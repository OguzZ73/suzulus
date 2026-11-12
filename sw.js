// Süzülüş — service worker: lets the game be installed and played offline.
// Network first, so a new version is picked up whenever there is a connection; the cache is only the fallback.
const CACHE = 'suzulus-v1';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'js/rain-audio.js', 'js/core.js', 'js/audio.js', 'js/state.js', 'js/world.js', 'js/game.js', 'js/update.js', 'js/sky.js',
  'js/render-scene.js', 'js/render-ground.js', 'js/render-obstacles.js', 'js/render-items.js', 'js/render-glider.js', 'js/render-fx.js', 'js/main.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});
