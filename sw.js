const CACHE_NAME = 'ghoti-fishing-cache-v10-resilient';
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
    '/js/fishingGameCore.js',
    '/js/fishingGameIntegration.js',
    '/js/gameAudioManager.js',
    '/js/gameComponents.js',
    '/js/gameLogManager.js',
    '/js/gameScenes.js',
    '/js/gameSpeciesMapper.js',
    '/js/gameUIManager.js',
    '/js/inputManager.js',
    '/js/motionPermissionUI.js',
    '/js/motionSensorManager.js',
    '/js/sensorFilters.js',
    '/js/confetti-effects.js',
    '/js/magicui-components.js',
    '/css/beautiful-buttons.css',
    '/Splashscreen.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                // Cache files individually to prevent atomic failure
                const cachePromises = ASSETS_TO_CACHE.map(async (url) => {
                    try {
                        await cache.add(url);
                        console.log('SW: Cached', url);
                    } catch (err) {
                        // Don't fail installation if optional files are missing
                        console.warn('SW: Failed to cache (continuing anyway):', url, err.message);
                    }
                });
                await Promise.all(cachePromises);
                console.log('SW: Installation complete');
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.error('Service Worker install error:', err);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activating new service worker...');
    event.waitUntil(
        caches.keys().then(async (cacheNames) => {
            // Delete ALL old caches aggressively
            const deletePromises = cacheNames.map(async (cacheName) => {
                if (cacheName !== CACHE_NAME) {
                    console.log('SW: Deleting old cache:', cacheName);
                    await caches.delete(cacheName);
                }
            });
            await Promise.all(deletePromises);
            console.log('SW: All old caches cleared');
        })
        .then(() => {
            console.log('SW: Taking control of all pages');
            return self.clients.claim();
        })
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