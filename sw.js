const CACHE_NAME = 'fishing-log-cache-v1';
const urlsToCache = [
    './index.html',
    './style.css',
    './script.js',
    './IMG-20160902-WA0002.jpg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});