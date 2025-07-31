const CACHE_NAME = 'ghoti-fishing-cache-v7-force-refresh';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/fish_algorithms.json',
    '/js/app.js',
    '/js/errorHandler.js',
    '/js/fishDatabase.js',
    '/js/selfImprovingAlgorithm.js',
    '/js/beautiful-buttons.js',
    '/js/logger.js',
    '/js/utils.js',
    '/js/eventManager.js',
    '/js/swUpdateManager.js',
    '/css/beautiful-buttons.css',
    '/Splashscreen.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.error('Service Worker install error:', err);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
        .catch((err) => {
            console.error('Service Worker activate error:', err);
        })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Service Worker: Skip waiting requested');
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch((err) => {
                                console.error('Service Worker cache put error:', err);
                            });
                        return response;
                    })
                    .catch((err) => {
                        console.error('Service Worker fetch error:', err);
                        throw err;
                    });
            })
            .catch((err) => {
                console.error('Service Worker cache match error:', err);
                return fetch(event.request);
            })
    );
});