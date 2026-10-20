/* Service worker: keeps the app itself (page, icons, libraries) available offline.
   The routine DATA is cached by the page itself (localStorage), not here.
   When you change index.html, bump VERSION so phones pick up the new copy. */
const VERSION = "routine-v17";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];




self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});




self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});




self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;




  const url = new URL(req.url);




  // Never touch the Apps Script API (data is handled by the page).
  if (url.hostname.endsWith("script.google.com") || url.hostname.endsWith("googleusercontent.com")) return;




  const sameOrigin = url.origin === self.location.origin;
  const library = url.hostname === "cdnjs.cloudflare.com" ||
                  url.hostname === "fonts.googleapis.com" ||
                  url.hostname === "fonts.gstatic.com";




  if (!sameOrigin && !library) return;




  // Open from cache at once, refresh it in the background.
  event.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(req, { ignoreSearch: sameOrigin }).then((cached) => {
        const fresh = fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    )
  );
});


