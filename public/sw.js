/* ------------------------------------------------------------------ *
 *  Service Worker — Boutik
 *
 *  Deux rôles :
 *    1. Rendre l'app installable et utilisable hors ligne
 *    2. Recevoir les notifications push (commandes)
 *
 *  Stratégie de cache volontairement prudente : on ne met JAMAIS en
 *  cache les réponses de l'API. Un vendeur qui verrait une commande
 *  périmée prendrait de mauvaises décisions. Seule la coquille de
 *  l'app est mise en cache.
 * ------------------------------------------------------------------ */

const VERSION = "boutik-v2";
const SHELL = ["/", "/icon-192.png", "/logo-boutik.png", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  /* RÈGLE ABSOLUE : le service worker ne touche QU'À nos propres fichiers
     (même origine). Toute requête vers un autre domaine — Google Fonts,
     Supabase, API externes — est laissée au navigateur, sans interception.
     Sans ce garde, le SW tentait de mettre en cache les polices Google, ce
     que la CSP bloque, provoquant des erreurs en cascade. */
  if (url.origin !== self.location.origin) {
    return;
  }

  /* Jamais de cache sur l'API ni l'auth : des données périmées
     sont pires qu'une erreur réseau. */
  if (
    e.request.method !== "GET" ||
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  /* Images et assets : cache d'abord, c'est ce qui coûte le plus
     cher en forfait data. */
  if (/\.(png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copy));
            return res;
          })
      )
    );
    return;
  }

  /* Navigation : réseau d'abord, cache en secours si la 3G tombe. */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/").then((r) => r || Response.error()))
    );
  }
});

/* ---------------- Notifications push ---------------- */

self.addEventListener("push", (e) => {
  let data = { title: "Boutik", body: "Tu as une nouvelle notification." };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {
    if (e.data) data.body = e.data.text();
  }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      /* Vibration : le vendeur a souvent le téléphone en poche. */
      vibrate: [180, 80, 180],
      tag: data.tag || "boutik",
      renotify: true,
      data: { url: data.url || "/dashboard/commandes" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url || "/dashboard/commandes";

  /* Si l'app est déjà ouverte, on la réutilise au lieu d'ouvrir
     un énième onglet. */
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});