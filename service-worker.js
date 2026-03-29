/* AgriSmart — offline shell: precache + network-first with cache fallback */
const CACHE_NAME = "agri-cache-v26";

const BASE = new URL(".", self.location.href).href;

function assetUrl(relPath) {
  return new URL(relPath, BASE).href;
}

/** Files next to this script (works in subfolders, not only site root). */
const PRECACHE_REL = [
  "index.html",
  "agri-config.js",
  "app.js",
  "manifest.json",
  "favicon.svg",
  "favicon.png",
  "icon-192.png",
  "icon-512.png",
  "banner-maize.svg"
];

function normalizeCacheRequest(request) {
  var u = new URL(request.url);
  if (u.origin !== self.location.origin || request.method !== "GET") return request;
  var path = u.pathname || "";
  if (path.endsWith("/app.js") || path.endsWith("app.js")) {
    return new Request(assetUrl("app.js"), { method: "GET" });
  }
  if (path.endsWith("/agri-config.js") || path.endsWith("agri-config.js")) {
    return new Request(assetUrl("agri-config.js"), { method: "GET" });
  }
  return request;
}

function indexRequest() {
  return new Request(assetUrl("index.html"), { method: "GET" });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        PRECACHE_REL.map(function (rel) {
          var url = assetUrl(rel);
          return cache.add(url).catch(function (err) {
            console.warn("[AgriSmart SW] precache skip:", rel, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = new URL(req.url);

  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req)
        .then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(indexRequest(), copy);
            });
          }
          return response;
        })
        .catch(function () {
          if (url.origin !== self.location.origin) {
            return new Response("Offline — open this link when you have internet.", {
              status: 503,
              statusText: "Offline",
              headers: { "Content-Type": "text/plain;charset=UTF-8" }
            });
          }
          return caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(req).then(function (hit) {
              return hit || cache.match(indexRequest());
            });
          });
        })
    );
    return;
  }

  if (req.method !== "GET" || url.origin !== self.location.origin) {
    event.respondWith(fetch(req));
    return;
  }

  var lookup = normalizeCacheRequest(req);

  event.respondWith(
    fetch(req)
      .then(function (response) {
        if (response && response.ok) {
          var c = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(lookup, c);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.open(CACHE_NAME).then(function (cache) {
          return cache.match(lookup).then(function (hit) {
            return hit || cache.match(req);
          });
        });
      })
  );
});
