// Service worker disabled. Older deployments registered a SW that intercepted
// fetches and cached responses; we unregister those from app.js. This file is
// kept as a no-op so any cached request to /sw.js still returns 200.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
    } catch (_) {}
  })());
});
