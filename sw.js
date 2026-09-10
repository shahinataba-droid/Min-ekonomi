// Service worker: gör appen installerbar och användbar utan nätverk.
// CACHE-namnet innehåller en kontrollsumma av app.js. När appen ändras ändras
// den här filen också, vilket är signalen webbläsaren behöver för att hämta
// den nya versionen i stället för att servera den gamla ur cachen.
const CACHE = "min-ekonomi-7479742a2d";
const ASSETS = ["./", "./index.html", "./app.js?v=7479742a2d", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

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

// Appfilerna hämtas nätverk-först när det finns uppkoppling, så en ny version
// slår igenom direkt. Utan nät faller den tillbaka på cachen.
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

  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});
