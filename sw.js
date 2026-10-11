/* 识食 · Service Worker
 * 策略： stale-while-revalidate（先给缓存保证秒开，后台静默拉新）
 * 关键修复：不再"缓存优先永不更新"。旧版本用 cache-first + 硬编码版本号，
 *           导致用户永远看到第一版；现在改为后台更新 + 版本号自动跟随。
 */
const VERSION = 'shishi-2026-10-11';
const CORE = ['./', './index.html', './manifest.json',
              './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE).catch(() => c.add('./index.html')))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('shishi-') && k !== VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== location.origin) return;          // 跨域（AI 接口）不插手
  if (url.pathname.includes('/api/')) return;           // 接口请求直连

  const isDoc = req.mode === 'navigate' || req.destination === 'document';

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: isDoc });

    const net = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (hit) {
      // 有缓存：立刻返回，同时后台静默更新（下次访问即最新）
      e.waitUntil(net.then(() => {}));
      return hit;
    }
    const res = await net;
    if (res) return res;
    // 彻底离线兜底：导航请求回 index.html，其余返回 503
    if (isDoc) {
      const shell = await cache.match('./index.html') || await cache.match('./');
      if (shell) return shell;
    }
    return new Response('离线且无缓存', { status: 503, statusText: 'Offline' });
  })());
});

// 允许页面主动触发更新
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
