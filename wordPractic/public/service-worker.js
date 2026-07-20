const CACHE_NAME = 'pl-uk-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Встановлення Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell');
      return cache.addAll(urlsToCache).catch(() => {
        // Якщо не всі файли доступні, встановлюємо безпеки
        console.log('Some URLs failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// Активація Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехоплення запитів
self.addEventListener('fetch', (event) => {
  // Тільки для GET запитів
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Якщо в кеші — повертаємо звідти
      if (response) {
        console.log('Serving from cache:', event.request.url);
        return response;
      }

      // Якщо нема в кеші — намагаємось отримати з мережі
      return fetch(event.request)
        .then((response) => {
          // Якщо статус OK — кешуємо
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Якщо нема мережі й нема в кеші
          console.log('Network request failed, offline mode');
          // Повертаємо головну сторінку як fallback
          return caches.match('/index.html');
        });
    })
  );
});

// Обробка push повідомлень (опціонально)
self.addEventListener('push', (event) => {
  const options = {
    body: 'Час практикувати слова! 🎮',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%231a1a2e" width="192" height="192"/><circle cx="96" cy="96" r="80" fill="%23e2b96f"/></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="48" fill="%23e2b96f"/></svg>',
    tag: 'game-reminder',
  };

  event.waitUntil(
    self.registration.showNotification('Польська → Українська', options)
  );
});

// Обробка кліку на повідомлення
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
