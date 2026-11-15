const VERSION = 'acervo3d-v2.27';
const STATIC = `${VERSION}-static`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = ['/', '/sobre', '/roadmap', '/404.html', '/model.html', '/optimize', '/pbr-editor', '/batch-optimize', '/scene-composer', '/blender-addon', '/optimizer.html', '/pbr-editor.html', '/pbr-editor.js', '/batch-optimizer.html', '/batch-optimizer.js', '/scene-composer.html', '/scene-composer.js', '/scene-composer-styles.css', '/blender-addon.html', '/free3dhub_blender.py', '/category-tree.css', '/category-tree.js', '/categories.js', '/audio-styles.css', '/audio.js', '/audio-player.js', '/audio-bootstrap.js', '/styles.css', '/app.js', '/humanoids.js', '/scenekits.js', '/model.js', '/optimizer.js', '/manifest.json', '/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== STATIC && key !== RUNTIME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(RUNTIME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    })));
    return;
  }
  if (url.pathname.startsWith('/model/')) {
    event.respondWith(fetch(request).catch(() => caches.match('/model.html')));
    return;
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(STATIC).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => request.mode === 'navigate' ? caches.match('/') : Promise.reject(new Error('offline')))));
});
