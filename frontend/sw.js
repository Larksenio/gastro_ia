// ──────────────────────────────────────────────────────────────
// sw.js — Service Worker de GastroIA
//
// ¿Qué es un Service Worker?
//   Es un script que el navegador ejecuta en segundo plano.
//   Nos permite que la app se pueda "instalar" en el celular
//   y funcione aunque no haya conexión (modo offline básico).
// ──────────────────────────────────────────────────────────────

const CACHE_NOMBRE    = 'gastro-ia-v1';
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
self.addEventListener('fetch', (evento) => {
  // Las peticiones POST (al backend) siempre van a la red, nunca desde caché
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request).then((respuestaCacheada) => {
      return respuestaCacheada || fetch(evento.request);
    })
  );
});
