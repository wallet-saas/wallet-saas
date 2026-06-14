/**
 * Stamply — Service Worker (PWA Commerçant)
 * 
 * Cache strategy:
 * - App shell: Cache First (instant load)
 * - API calls: Network First (fresh data)
 * - Images: Cache First with expiration
 */

const CACHE_NAME = 'stamply-merchant-v' + Date.now();
const STATIC_CACHE = 'stamply-static-v' + Date.now();
const API_CACHE = 'stamply-api-v' + Date.now();

// App shell files to cache immediately
const SHELL_FILES = [
  '/',
  '/dashboard',
  '/scan',
  '/boutiques',
  '/analytics',
  '/manifest-merchant.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache app shell, then immediately claim
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(SHELL_FILES);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches, claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API calls: Network First, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets (JS, CSS, images): Cache First
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: Network First with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Hors ligne', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For HTML pages, return the app shell
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/');
    }

    return new Response('Hors ligne', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Background sync for offline scans
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncPendingScans());
  }
});

async function syncPendingScans() {
  const db = await openDB();
  const pending = await db.getAll('pendingScans');

  for (const scan of pending) {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scan.token}`,
        },
        body: JSON.stringify({ qr_string: scan.qrString }),
      });

      if (response.ok) {
        await db.delete('pendingScans', scan.id);
      }
    } catch (err) {
      console.error('[SW] Sync scan failed:', err);
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification Stamply',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Fermer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Stamply', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StamplyDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve({
      getAll: (store) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      }),
      delete: (store, id) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readwrite');
        const req = tx.objectStore(store).delete(id);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      }),
      put: (store, data) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readwrite');
        const req = tx.objectStore(store).put(data);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      }),
    });
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingScans')) {
        db.createObjectStore('pendingScans', { keyPath: 'id' });
      }
    };
  });
}
