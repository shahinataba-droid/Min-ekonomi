// Service worker: gör appen installerbar och användbar utan nätverk.
// CACHE-namnet innehåller en kontrollsumma av app.js, vilket är signalen
// webbläsaren behöver för att hämta en ny version i stället för den cachade.
const CACHE = "min-ekonomi-ef29f8e804";
const ASSETS = ["./", "./index.html", "./app.js?v=ef29f8e804", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Appfilerna hämtas nätverk-först när det finns uppkoppling, med cachen som
// reserv offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isAppShell =
    url.origin === location.origin &&
    (url.pathname.endsWith("/") || url.pathname.endsWith("index.html") || url.pathname.endsWith("app.js"));

  if (isAppShell) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).catch(() => caches.match("./index.html"))));
});
