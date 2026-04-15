// Service Worker для Femmetry
// Кэширует статические файлы и данные для офлайн-доступа

const CACHE_NAME = 'femmetry-v1';
const STATIC_CACHE = 'femmetry-static-v1';
const DATA_CACHE = 'femmetry-data-v1';

// Файлы для кэширования (статический контент)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/cabinet.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            console.log('[SW] Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Кэширование данных из GitHub (JSON)
  if (url.includes('github.io') && url.includes('.json')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => {
          return cache.match(event.request);
        });
      })
    );
    return;
  }
  
  // Статические файлы
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
