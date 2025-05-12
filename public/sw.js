const CACHE_NAME = 'series-circle-talk-cache-v1';

// Adiciona um ouvinte para o evento de instalação do service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

// Adiciona um ouvinte para o evento de ativação do service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove qualquer cache antigo que não seja o atual
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta as requisições da rede e implementa a estratégia de cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verifica se a resposta da rede é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clona a resposta, pois ela só pode ser consumida uma vez
        const responseToCache = response.clone();

        // Armazena a nova resposta no cache
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Se a requisição falhar, tenta recuperar do cache
        return caches.match(event.request);
      })
  );
});
