// ──────────────────────────────────────────────────────────────
// sw.js — Service Worker de GastroIA
//
// ¿Qué es un Service Worker?
//   Es un script que el navegador ejecuta en segundo plano.
//   Nos permite que la app se pueda "instalar" en el celular
//   y funcione aunque no haya conexión (modo offline básico).
// ──────────────────────────────────────────────────────────────

const CACHE_NOMBRE    = 'gastro-ia-v2';
const ARCHIVOS_CACHE  = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Instalación: guardamos los archivos estáticos en caché
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOMBRE).then((cache) => {
      return cache.addAll(ARCHIVOS_CACHE);
    })
  );
  self.skipWaiting(); // activamos el SW inmediatamente
});

// Activación: limpiamos cachés viejos si los hubiera
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) => {
      return Promise.all(
        nombres
          .filter(nombre => nombre !== CACHE_NOMBRE)
          .map(nombre => caches.delete(nombre))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cuando la app pide un recurso, intentamos servirlo desde caché.
// Si no está en caché (ej: la llamada al backend), vamos a la red.
// Fetch: intentamos siempre la red primero (versión más actual).
// Si falla (sin internet), recién ahí usamos la caché como respaldo.
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    fetch(evento.request)
      .then((respuestaRed) => {
        // Actualizamos la caché con la versión nueva
        const copia = respuestaRed.clone();
        caches.open(CACHE_NOMBRE).then((cache) => cache.put(evento.request, copia));
        return respuestaRed;
      })
      .catch(() => caches.match(evento.request)) // sin internet -> usa caché
  );
});
