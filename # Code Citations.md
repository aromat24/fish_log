# Code Citations

## License: MIT
https://github.com/tkssharma/tkssharma.github.io/tree/53b556fac2d12eee1fb2c412c33ab6bd70632cad/_posts/blog/2020-01-29-write-pwa-application-using-pwa.md

```
",
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512x512.png",
      "sizes"
```


## License: MIT
https://github.com/ragingwind/pwa-manifest/tree/15a07296af8eccd34a5371fdcbb3194b5382c9a6/readme.md

```
"icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512x512.png",
      "sizes": "512x512",
      "type": "image/
```


## License: unknown
https://github.com/ra-md/simple-pwa/tree/c1c81450cd23e8553a254906be0546e6921454f3/service-worker.js

```
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event =>
```


## License: MIT
https://github.com/irfanfadilah/xpense/tree/e4ab2776c4c55f9cb200f833402e4f575ee05b39/service-worker.js

```
.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response
```


## License: unknown
https://github.com/renyamizuno/pwa_test/tree/1e1769f56bff787ff1d7bb7fec19160f79df80ce/sw.js

```
(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response =>
```

