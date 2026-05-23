// FoodView service worker — instant load + offline app shell.
// Strategy:
//   • app shell (html/js/css/fonts/icons): precached, stale-while-revalidate
//   • Supabase Storage images + CDN libs: cache-first (immutable-ish)
//   • Supabase REST/Auth + /api/*: never cached (always network — data/sessions)
//   • navigations: network-first, fall back to the cached shell when offline
// Bump VERSION to force a refresh of the precached shell on the next visit.
const VERSION = 'v3';
const SHELL_CACHE = `foodview-shell-${VERSION}`;
const ASSET_CACHE = `foodview-assets-${VERSION}`;

const SHELL = [
    '/index.html',
    '/styles/styles.css',
    '/js/utils.js', '/js/data.js', '/js/modals.js', '/js/render.js',
    '/js/auth.js', '/js/photos.js', '/js/app.js',
    '/manifest.json',
    '/assets/icon-192.png', '/assets/icon-512.png', '/assets/favicon.svg',
    '/assets/fonts/dmsans-latin.woff2', '/assets/fonts/dmsans-latin-ext.woff2'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

function keepable(res) {
    return res && (res.ok || res.type === 'opaque');
}
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const res = await fetch(request);
        if (keepable(res)) (await caches.open(cacheName)).put(request, res.clone());
        return res;
    } catch (_) {
        return cached || Response.error();
    }
}
async function staleWhileRevalidate(request, cacheName) {
    const cached = await caches.match(request);
    const network = fetch(request).then(res => {
        if (keepable(res)) caches.open(cacheName).then(c => c.put(request, res.clone()));
        return res;
    }).catch(() => cached);
    return cached || network;
}

self.addEventListener('fetch', (e) => {
    const { request } = e;
    if (request.method !== 'GET') return; // mutations always hit the network
    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    // Supabase REST/Auth and our serverless endpoints: never cache (fresh data/auth).
    if (url.hostname.endsWith('supabase.co') && !url.pathname.startsWith('/storage/v1/')) return;
    if (sameOrigin && url.pathname.startsWith('/api/')) return;

    // Supabase Storage images + CDN libraries → cache-first.
    if ((url.hostname.endsWith('supabase.co') && url.pathname.startsWith('/storage/v1/'))
        || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com') {
        e.respondWith(cacheFirst(request, ASSET_CACHE));
        return;
    }

    // Page navigations → network-first, fall back to the cached shell offline.
    if (request.mode === 'navigate') {
        e.respondWith(fetch(request).catch(() => caches.match('/index.html')));
        return;
    }

    // Same-origin static assets → stale-while-revalidate.
    if (sameOrigin) {
        e.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    }
});
