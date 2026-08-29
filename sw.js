// BOSS RAID service worker — アプリシェルをキャッシュしてオフラインでも起動できるように。
// バージョンを上げると古いキャッシュは破棄される。
const V = 'boss-raid-v1.6.2';
const SHELL = [
  './', './index.html', './style.css', './manifest.webmanifest', './icon.svg', './icon-192.png',
  './js/main.js', './js/config.js', './js/bosses.js', './js/net.js', './js/fx.js', './js/hitfx.js',
  './js/prefs.js', './js/settings.js', './js/bossfx.js', './js/records.js', './js/pet.js',
  './js/skins.js', './js/keybinds.js', './js/version.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Supabase(REST / Realtime)は必ずネットワーク
  if (url.hostname.endsWith('supabase.co')) return;

  if (url.origin === self.location.origin) {
    // stale-while-revalidate
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request)
          .then((res) => {
            if (res && res.ok) caches.open(V).then((c) => c.put(e.request, res.clone()));
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  } else if (url.hostname === 'esm.sh' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => {
          if (res && res.ok) caches.open(V).then((c) => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
  }
});
