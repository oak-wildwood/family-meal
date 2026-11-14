/*
 * Family Meal service worker: makes the site installable and readable offline.
 *
 * Hand-written instead of @angular/service-worker on purpose. Angular's worker
 * answers every navigation with the cached index.html, which on this
 * prerendered site is the Home page's HTML; serving it for /recipes/<slug>
 * breaks hydration. Here each page is its own prerendered HTML, fetched from
 * the network first and cached for offline use.
 *
 * AnyList is unaffected: it fetches pages server-side, where no worker runs.
 */
const VERSION = 'v1';
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const SHELL = ['/', '/offline.html', '/recipes/index.json', '/manifest.webmanifest'];
/** Old hashed bundles pile up across deploys; keep the newest this many assets. */
const MAX_ASSETS = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      await pages.addAll(SHELL);
      await saveAllRecipes();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [PAGES, ASSETS];
      for (const key of await caches.keys()) {
        if (!keep.includes(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

// The page asks for this on every load, so recipes added after install are saved too.
self.addEventListener('message', (event) => {
  if (event.data === 'save-recipes') event.waitUntil(saveAllRecipes());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGES, '/offline.html'));
  } else if (url.pathname.startsWith('/recipes/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request, PAGES));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/** Saves every recipe page, its cook mode, its JSON and its photo. Best effort: offline, it keeps what it has. */
async function saveAllRecipes() {
  try {
    const res = await fetch('/recipes/index.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const pages = await caches.open(PAGES);
    // Clone before reading: a body that has been read can't be cloned.
    await pages.put('/recipes/index.json', res.clone());
    const rows = await res.json();
    const urls = rows.flatMap(({ slug }) => [
      `/recipes/${slug}`,
      `/recipes/${slug}/cook`,
      `/recipes/${slug}.json`,
    ]);
    await trimAssets();
    const assets = await caches.open(ASSETS);
    await Promise.all(
      // One failed URL (say, a missing photo) shouldn't stop the rest from saving.
      urls.map(async (u) => {
        try {
          const r = await fetch(u, { cache: 'no-cache' });
          if (!r.ok) return;
          await pages.put(u, unredirect(r.clone()));
          // A recipe's photo, so its page looks right offline too.
          if (u.endsWith('.json')) {
            const { image } = await r.json();
            if (image && !(await assets.match(image))) await assets.add(image);
          }
        } catch {
          // Try again on the next page load.
        }
      }),
    );
  } catch {
    // Offline or a failed request: the next page load tries again.
  }
}

/**
 * A host that redirects /recipes/x to /recipes/x/ gives a "redirected" response,
 * which the browser refuses to use for a page navigation. Copy it into a plain one.
 */
function unredirect(res) {
  return res.redirected
    ? new Response(res.body, { status: res.status, headers: res.headers })
    : res;
}

async function trimAssets() {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  // Cache keys come back oldest first.
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((k) => cache.delete(k)),
  );
}

async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) await cache.put(request, unredirect(res.clone()));
    return res;
  } catch {
    const hit =
      (await cache.match(request, { ignoreSearch: true })) ?? (await matchTrailing(cache, request));
    if (hit) return hit;
    if (fallback) return (await cache.match(fallback)) ?? Response.error();
    return Response.error();
  }
}

/** "/recipes/x/" and "/recipes/x" are the same page. */
function matchTrailing(cache, request) {
  const url = new URL(request.url);
  const alt =
    url.pathname.endsWith('/') && url.pathname !== '/'
      ? url.pathname.slice(0, -1)
      : `${url.pathname}/`;
  return cache.match(alt);
}

/** Scripts and styles have hashed names; fonts and photos rarely change. Serve fast, refresh behind. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit ?? (await fresh) ?? Response.error();
}
