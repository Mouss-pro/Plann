// ── SERVICE WORKER — PLANNING ──
// Mise en cache de l'app pour fonctionnement hors-ligne (PWA)

const CACHE_NAME = 'planning-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── Installation : mise en cache des fichiers de base ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : nettoyage des anciens caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie "cache d'abord, réseau en secours" ──
// Les requêtes vers des CDN externes (polices, librairie docx) passent
// directement au réseau pour rester à jour ; le reste est servi du cache.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isSameOrigin = url.startsWith(self.location.origin);

  if (!isSameOrigin) {
    // Ressource externe (CDN) : on tente le réseau, sinon on ignore (mode hors-ligne)
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 200 }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => cached);
    })
  );
});
