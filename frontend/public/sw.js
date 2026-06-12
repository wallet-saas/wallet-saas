const CACHE_NAME = 'stamply-v' + Date.now();
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/dashboard/scan',
  '/dashboard/cartes',
  '/dashboard/analytics',
  '/dashboard/notifications',
  '/dashboard/offres',
  '/dashboard/boutiques',
  '/dashboard/auto-review',
  '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log('[SW] Partial cache install');
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first strategy for API calls, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: always use network, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (request.method === 'GET' && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (request.mode === 'navigate') {
        return caches.match('/');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

// Push notifications handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message || data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.action_url || data.click_action || '/dashboard/notifications',
    },
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Stamply', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

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
      await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scan.token}`,
        },
        body: JSON.stringify({ pass_serial_number: scan.pass_serial_number }),
      });
      await db.delete('pendingScans', scan.id);
    } catch (err) {
      console.error('[SW] Sync failed for scan:', scan.id);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('stamply-offline', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('pendingScans', { keyPath: 'id', autoIncrement: true });
    };
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
    });
    request.onerror = () => reject(request.error);
  });
}
