/* سرویس‌ورکر لینک: پوستهٔ برنامه را نگه می‌دارد تا سریع باز شود؛ درخواست‌های Appwrite هرگز کش نمی‌شوند. */
const V = 'link-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './appwrite-sdk.js',
  './icons/icon.svg', './icons/favicon-48.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/(^|\.)appwrite\.io$/.test(u.hostname)) return;               // API، فایل‌ها و Realtime
  if (r.mode === 'navigate') {                                        // اول شبکه (به‌روز می‌ماند)، بعد کش (آفلاین)
    e.respondWith(fetch(r).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); }
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  const same = u.origin === location.origin;
  const cdn = /(^|\.)(jsdelivr\.net|gstatic\.com|googleapis\.com)$/.test(u.hostname);   // کتابخانهٔ Appwrite و فونت
  if (!same && !cdn) return;
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
