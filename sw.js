// STAR LUX Service Worker - Performance Optimized
const CACHE_VERSION = 'v2';
const CACHE_NAME = `starlux-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `starlux-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `starlux-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// الملفات الأساسية للتخزين المؤقت - Precache
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// مدة صلاحية الكاش (بالثواني)
const CACHE_EXPIRY = {
  images: 30 * 24 * 60 * 60, // 30 يوم
  fonts: 365 * 24 * 60 * 60, // سنة
  scripts: 7 * 24 * 60 * 60, // 7 أيام
  styles: 7 * 24 * 60 * 60, // 7 أيام
  api: 5 * 60, // 5 دقائق
};

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية التخزين المؤقت
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات API - نريدها دائماً من الشبكة
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // تخزين استجابات GET الناجحة
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // محاولة الحصول من الكاش عند فشل الشبكة
          return caches.match(request);
        })
    );
    return;
  }

  // للصفحات والأصول الثابتة - Network First, Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // للأصول الثابتة - Cache First, Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // تحديث الكاش في الخلفية
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// استقبال Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'STAR LUX',
    body: 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'starlux-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'فتح' },
        { action: 'close', title: 'إغلاق' }
      ]
    })
  );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // إذا كان هناك نافذة مفتوحة، انتقل إليها
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // فتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync للعمليات المعلقة
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// مزامنة السلة
async function syncCart() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingCart = await cache.match('/pending-cart');
    if (pendingCart) {
      const cartData = await pendingCart.json();
      await fetch('/api/trpc/cart.sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });
      await cache.delete('/pending-cart');
    }
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

// مزامنة الطلبات
async function syncOrders() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const pendingOrders = await cache.match('/pending-orders');
    if (pendingOrders) {
      const ordersData = await pendingOrders.json();
      await fetch('/api/trpc/orders.sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordersData)
      });
      await cache.delete('/pending-orders');
    }
  } catch (error) {
    console.error('[SW] Orders sync failed:', error);
  }
}

console.log('[SW] Service Worker loaded');
