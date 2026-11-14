# Agent instructions

Instructions for AI coding agents working in this repository. Humans should read the README.

## What this project is, and why it constrains you

From the source this looks like a small Angular recipe blog. Its real job is narrower: every
recipe page must import cleanly into the AnyList app, which fetches the URL server-side, does
not run JavaScript, and reads the schema.org `Recipe` JSON-LD from the HTML it receives. A spike
(issue #1) confirmed JSON-LD in the served HTML imports, and JSON-LD added by client-side
JavaScript does not. So the JSON-LD block in the prerendered HTML is the product. A change can
look right in the browser, pass every test, and still break the import, which is why the check
that matters runs against the built HTML (see "Working in this repo").

It is also a modern-Angular practice project. Oak writes the feature logic; agents scaffold,
wire, explain and review.

## Hard rules

- **This repo is public, and so is its entire history.** A secret, email or personal detail
  that is committed and then deleted is still published, and a pushed PR cannot be deleted
  without GitHub Support. Before any commit, push or PR, check what the change reveals.
- **Nothing personal in commits, fixtures, recipes, issues or PR text.** Fixtures use invented
  data. If in doubt, ask Oak before pushing; afterward is too late.
- **No `/Users/` paths, account names, tokens or real email addresses** in any file or commit
  message. Commits use the GitHub noreply identity; a real address in a commit is public
  forever.
- **Recipes are published content: a recipe file carries only the recipe.** Name, neutral
  description, ingredients, steps, yield, times and neutral tags. Recipes may start from private
  notes; none of that context (why it was chosen, who it is for, anything about the household)
  belongs in the file, the tags or the commit message. Each recipe is a public page under Oak's name.
- **Never copy another site's recipe text verbatim.** Write the description and steps in your
  own words and link the source in `isBasedOn` when there is one; a copied recipe on a public
  site invites a takedown.
- **Never move recipe routes off `RenderMode.Prerender`, and never add JSON-LD only on the
  client.** AnyList doesn't run JavaScript, so the import fails silently and nothing in the
  browser shows it.
- **Keep the site noindex** (`<meta name="robots">` and the `X-Robots-Tag` header) until Oak
  decides otherwise. Don't replace it with a `robots.txt` Disallow: a crawler blocked by
  robots.txt never sees the noindex.
- **Don't write the feature logic in the practice shells** (`servings-scaler`,
  `ingredient-checklist`, `recipe-list`). Oak writes those to practice; a
  finished implementation defeats the point. Give hints, reviews and fixes to plumbing and setup.
- **Never comment `@claude` or `@flytrap`, and never edit `.github/workflows/`.** Each run
  spends Oak's Claude usage. Workflow changes happen in local sessions with Oak; the shared
  workflows live in `oak-wildwood/gh-repo-init`.

## Invariants that are easy to break by accident

- **JSON-LD is set in the route resolver, before the route activates.** That is what puts it
  in the prerendered HTML. Moving it into `effect()`, `afterNextRender()`, `@defer` or any
  browser-only path removes it from the served page while the browser still shows it.
- **One `Recipe` object renders both the visible page and the JSON-LD** (via `toJsonLd`).
  Never hand-write a second copy of ingredients or steps; the two drift, and AnyList imports
  the JSON-LD one.
- **Durations are ISO 8601** (`PT15M`, `PT1H30M`). That is the only format the spike verified.
- **`recipeIngredient` is one string per ingredient line, quantity first** ("1 1/2 cups brown
  lentils, rinsed"). AnyList parses quantity and unit from each string; don't split or merge lines.
- **`recipeInstructions` is an ordered array of `HowToStep` objects**, one per step.
- **`<` is escaped as `\u003c` when serializing JSON-LD.** A `</script>` in recipe text would
  otherwise end the script element early. Angular templates strip `<script>`, so JSON-LD goes
  through `JsonLdService` only.
- **`image` is an absolute `https://` URL** built from `SITE_ORIGIN`; an importer fetching
  server-side has nothing to resolve a relative URL against.
- **Every recipe file is listed in `public/recipes/index.json`.** `getPrerenderParams` reads that
  manifest, so an unlisted recipe is never prerendered and its URL 404s. A spec checks the match.
- **Slugs are permanent once deployed.** The URL may already be shared or saved in AnyList.

## Working in this repo

Check the product, not the browser:

    npx ng build && grep -c 'application/ld+json' dist/family-meal/browser/recipes/<slug>/index.html

The spike pages on the `gh-pages` branch stay until issue #1 is closed. Don't touch that branch.

### Spelling

Write American English everywhere: code, comments, docs, commit messages and PR text. That means
behavior, authorization, optimize, judgment and defense, not behaviour, authorisation, optimise,
judgement or defence.

### PR titles become commit messages

This repo squash-merges, and the squashed commit takes the **PR title** as its subject with an
empty body. So the PR title is not a label on a discussion — it is the permanent record of the
change in `git log`, and it is the only part that survives the merge.

Write it as a conventional commit: `type: imperative summary`, lowercase after the colon, no
trailing period, under about 70 characters.

```
feat: add CSV export to the reports page
fix: stop the date filter dropping the last day of the range
test: add coverage for the retry path
docs: record why we hand-roll the parser
ci: run the formatter check on pull requests
refactor: extract the pagination hook
chore: bump the linter to 10.2
```

Use `feat` and `fix` for changes a user would notice, and `refactor` for ones they wouldn't.
`test`, `docs`, `ci` and `chore` cover the rest. When a change spans several types, name the one
that carries the point of the PR rather than the one touching the most files.

Individual commits on the branch don't survive the squash, so they're for the reviewer rather than
for history. Use them to separate things worth reviewing apart — a mechanical reformat from a
behavioral change, say — and don't agonize over their wording.
