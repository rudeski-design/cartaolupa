const VERSION = "cartaolupa-v1";
const CORE = [
  "./", "./index.html", "./offline.html", "./manifest.webmanifest",
  "./icons/favicon.svg", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Páginas: rede primeiro (conteúdo atualizado), cache como reserva
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(r => {
        caches.open(VERSION).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match("./offline.html")))
    );
    return;
  }

  // Demais arquivos (ícones, imagens Unsplash): cache primeiro
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return r;
    }).catch(() => hit))
  );
});
