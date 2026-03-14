var CACHE_NAME = 'forged-v6';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  // Skip caching for Supabase API, Google Fonts API, and other external requests
  if (url.indexOf('supabase') !== -1 ||
      url.indexOf('googleapis.com') !== -1 ||
      url.indexOf('gstatic.com') !== -1 ||
      url.indexOf('cdn.jsdelivr.net') !== -1) {
    return;
  }
  // Stale-while-revalidate: serve cached version immediately, fetch fresh in background
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(function() {
          return cached;
        });
        return cached || fetchPromise;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
