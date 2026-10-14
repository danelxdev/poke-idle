// Service worker de PokéIdle: la app funciona sin conexión.
// - Código, estilos y datos: red primero (las novedades llegan al instante) y copia guardada si no hay red.
// - Sprites de Pokémon (assets/pokemon): caché primero, se guardan al verlos (hasta MAX_SPRITES).
'use strict';
const VERSION = 'pokeidle-v1';
const SPRITES = 'pokeidle-sprites-v1';
const MAX_SPRITES = 1500;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/data/pokedex.js', 'js/data/forms.js', 'js/data/moves.js', 'js/data/idle.js', 'js/i18n.js', 'js/data/en.js', 'js/art/tiles.js', 'js/art/vfx.js', 'js/art/icons.js',
  'js/sprites.js', 'js/core.js', 'js/pwa.js', 'js/a11y.js', 'js/audio.js', 'js/arena.js', 'js/title.js', 'js/ui.js', 'js/main.js',
  'assets/pwa/icon-192.png', 'assets/pwa/icon-512.png', 'assets/pwa/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== SPRITES).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_SPRITES; i++) await cache.delete(keys[i]);
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/assets/pokemon/')) {
    e.respondWith(caches.open(SPRITES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { c.put(req, res.clone()); trim(c); }
      return res;
    }));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./index.html')));
});
