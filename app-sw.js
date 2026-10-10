/* App-owned worker: static files only. Never cache auth, API responses, or OAuth query strings. */
const VERSION = "43d9c46b02c79eea";
const PREFIX = "context-vocab-static:" + new URL(self.registration.scope).pathname + ":";
const CACHE = PREFIX + VERSION;
self.addEventListener("install", event => { event.waitUntil((async () => {
  const manifest = await fetch(new URL("precache.json", self.registration.scope), { cache: "no-store" });
  if (!manifest.ok) throw new Error("Precache unavailable");
  const { files } = await manifest.json(); const cache = await caches.open(CACHE);
  await cache.addAll(files.map(path => new URL(path, self.registration.scope).href));
})()); });
// No skipWaiting: an open session keeps its matching bundle until the next visit.
self.addEventListener("activate", event => { event.waitUntil((async () => { for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name); await self.clients.claim(); })()); });
self.addEventListener("fetch", event => {
  const request = event.request; const url = new URL(request.url); const scope = new URL(self.registration.scope);
  if (request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || request.headers.has("authorization")) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => { try { return await fetch(request); } catch { const cached = await caches.match(new URL("index.html", scope).href); if (cached) return cached; return new Response("首次使用请联网打开语境词本。", { status: 503, headers: { "Content-Type": "text/plain;charset=utf-8" } }); } })()); return;
  }
  const relative = url.pathname.slice(scope.pathname.length);
  if (!/^(assets\/|icons\/|ocr\/|manifest\.webmanifest$)/.test(relative)) return;
  url.search = "";
  event.respondWith((async () => { const cache = await caches.open(CACHE); const cached = await cache.match(url.href); if (cached) return cached; const response = await fetch(request); if (response.ok && response.type !== "opaque") await cache.put(url.href, response.clone()); return response; })());
});
