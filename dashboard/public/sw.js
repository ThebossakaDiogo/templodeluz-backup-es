// Service Worker para OD METRICS PWA
const CACHE_NAME = "od-metrics-v1";
const STATIC_ASSETS = [
  "/",
  "/visao-geral",
  "/rastreamento",
  "/pedidos",
  "/relatorios",
  "/whatsapp",
  "/login",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon.svg",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Falha ao pré-carregar alguns assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estratégia de requisições:
// 1. Chamadas de API do Supabase e rotas dinâmicas -> NETWORK FIRST (sempre dados reais frescos)
// 2. Assets estáticos -> STALE WHILE REVALIDATE
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Não intercepta chamadas de banco ou autenticação
  if (url.hostname.includes("supabase.co") || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
