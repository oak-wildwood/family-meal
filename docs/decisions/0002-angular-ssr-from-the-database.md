# 0002: Recipe pages are server-rendered from the database

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

AnyList imports a recipe by fetching its URL server-side, without running JavaScript, and
reading the schema.org `Recipe` JSON-LD in the HTML it receives (spike, issue #1). Today every
recipe page is prerendered at build time from the JSON files, which is why `AGENTS.md` forbids
moving recipe routes off `RenderMode.Prerender`.

Once recipes live in Supabase ([0001](0001-supabase-backend.md)), a build-time prerender would
need a rebuild and deploy for every new or edited recipe, which is the step this work exists to
remove.

## Decision

Switch the app from `outputMode: "static"` to **Angular SSR** with a Node server:

- **Recipe pages (`/recipes/:slug`, `/recipes/:slug/cook`) use `RenderMode.Server`.** The route
  resolver loads the recipe from Supabase on the server and sets the JSON-LD before the route
  activates, exactly as it does today from the JSON file. The HTML the server sends is the
  product, as before.
- **Home uses `RenderMode.Server`** too, so a new recipe appears without a deploy.
- **Owner pages (`/admin`, `/plan`, `/pantry`) use `RenderMode.Client`.** They sit behind
  sign-in, have nothing to import, and need no server rendering.
- Responses for public pages carry cache headers, so a CDN can serve them and the server only
  renders on a cache miss. An edit purges that recipe's cached pages.

## Consequences

- **The `AGENTS.md` rule "never move recipe routes off `RenderMode.Prerender`" is replaced** in
  the same PR that makes this switch, by the rule that matters: JSON-LD must be in the HTML the
  server sends, set in the resolver, never only on the client.
- **`recipe:check` checks a running server instead of build output** (curl the SSR server and
  check the JSON-LD), and it runs against every recipe in the database.
- **The site now needs a server at runtime.** Where it runs is [0003](0003-host-on-doks-with-opentofu-and-helm.md).
- **The service worker (`public/sw.js`) caches recipe JSON files today** and must learn the new
  URLs, so offline cook mode keeps working.
- **A database outage now takes recipe pages down**, where static files did not care. The CDN
  cache softens that for pages already cached.
- **Fallback:** if keeping a server becomes a burden, the app can go back to prerendering from
  the database at build time, triggered by a deploy hook on each submission. Slower to publish,
  but needs no runtime server.
