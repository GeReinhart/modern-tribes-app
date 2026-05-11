// Clears all caches and unregisters this service worker.
// Replaces the previous caching service worker.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    await self.clients.claim();
    await self.registration.unregister();
});
