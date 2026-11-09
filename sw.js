
/*
  PROTOGEN AI — SERVICE WORKER
  Offline website cache for localhost and GitHub Pages.

  Whenever you publish important file changes, change CACHE_NAME
  from protogen-savage-v1 to protogen-savage-v2, then v3, etc.
*/

const CACHE_NAME = "protogen-savage-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./roast-engine.js",
  "./roasts.json"
];

// Install: download and store the important app files.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old versions of the app cache.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: serve saved files first, then try the internet.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestURL = new URL(request.url);

  // Only cache files belonging to this website.
  if (requestURL.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true })
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const responseCopy = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseCopy));
            }

            return networkResponse;
          })
          .catch(() => {
            // When offline, return the saved home page for navigation.
            if (request.mode === "navigate") {
              return caches.match("./index.html");
            }

            return new Response(
              "This Protogen resource is not available offline yet.",
              {
                status: 503,
                statusText: "Offline"
              }
            );
          });
      })
  );
});
