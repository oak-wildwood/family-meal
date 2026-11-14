---
name: add-recipe
description: Add a recipe to the site from a Claude recipe-card share link (claude.ai/public/artifacts/...) or pasted recipe text, ending in a PR. Use when Oak shares a recipe link, pastes a recipe, or says "add this recipe".
---

# add-recipe

Turns one Claude recipe card into `public/recipes/<slug>.json` plus its manifest row, checks the
prerendered page, and opens a PR. Every recipe becomes a **public page under Oak's name** in a
public repo, so the hard rules in `AGENTS.md` (recipe files carry only the recipe; nothing
personal) govern every field you write.

## 1. Get the recipe text

- **Share link:** read it with Claude in Chrome: `tabs_context_mcp`, then `tabs_create_mcp`,
  `navigate` to the link, `get_page_text`. The page renders with JavaScript, so it can only be
  read through a browser. If the Chrome tools aren't loaded, ask Oak to paste the card text or
  restart with `claude --chrome`.
- **Pasted text:** use it as given.

Done when you hold the title, servings, times, every ingredient line, every step and the notes.

## 2. Write `public/recipes/<slug>.json`

The schema is `Recipe` in `src/app/recipes/recipe.model.ts`; the seed recipe in the same folder
is a worked example. Pick the slug as kebab-case of the name; it is **permanent** once
deployed, so check `public/recipes/index.json` and choose one that's free.

Converting a card:

| Card | JSON |
|---|---|
| Ingredient "0.5 small onion, diced" | `{ "qty": 0.5, "unit": "small", "item": "onion, diced" }` |
| Countable item, no unit ("2 carrots") | `{ "qty": 2, "item": "carrots" }` |
| No quantity ("Salt, to taste") | `{ "item": "Salt, to taste" }` |
| Ingredient sections ("For the dressing") | `group` on each line in that section |
| Step "Render the bacon: Cook it until crisp, 5 minutes" | `{ "title": "Render the bacon", "text": "Cook it until crisp, 5 minutes.", "timerMinutes": 5 }` |
| Timer range ("25 to 30 minutes") | `timerMinutes` = the upper bound |
| Notes paragraph | `notes`: one short cooking note per array item |
| Named source website | `basedOn`: its URL |

**Decimals.** Cards round to one decimal, so a third shows as 0.3. Store the true fraction to
three places, and the site formats it back: 0.1 → `0.125`, 0.3 → `0.333`, 0.7 → `0.667`,
0.8 → `0.75`, 0.5 stays `0.5`. A two-decimal value (0.25) is already exact. When a one-decimal
value could be two fractions (0.2 is 1/4 or 1/5), compare the step text, which usually repeats
the ingredient, and ask Oak if it still reads two ways.

**Times.** `prepMinutes`, `cookMinutes` and `totalMinutes` come from the card. AnyList shows them,
so a missing time is a question for Oak, answered before you write the file.

**Description and tags.** One neutral line that describes the dish. Tags are lowercase and
neutral (dish type, main ingredient, diet); reuse tags already in `index.json`.

**Public content.** Write each step in plain recipe language. Keep chat context, who the recipe
is for, and anything about the household out of every field and out of the commit and PR text.
The share link itself stays out of the repo. Notes are public too: keep them to cooking notes
("less salt next time").

Done when every card ingredient and step has exactly one entry in the file, in card order.

## 3. Add the photo (only if Oak provides one)

Photos are optional; the page works without one. With a photo:

1. Confirm with Oak it shows only food: no people, no identifiable place.
2. `sips -s format jpeg <photo> --out public/recipes/images/<slug>.jpg` (converts HEIC and PNG).
   If `sips -g pixelWidth -g pixelHeight` shows a side over 1600px, shrink it with
   `sips -Z 1600 <file>`; `-Z` also enlarges, so smaller photos stay as they are.
3. `npm run image:strip -- public/recipes/images/<slug>.jpg`, after every `sips` step, since
   `sips` writes its own EXIF. **Required for every photo:** phone photos carry GPS location,
   and git history is permanent.
4. Set `"image": "/recipes/images/<slug>.jpg"`.

Done when the strip step has run on the exact file you will commit.

## 4. Add the manifest row

Append `{ "slug", "name", "tags" }` to `public/recipes/index.json`, copied from the recipe file.
A recipe missing from the manifest is never prerendered and its URL 404s.

## 5. Verify the built page

```bash
npx ng test --watch=false
npx ng build
npm run recipe:check -- <slug>
```

The manifest spec checks the manifest against the files; `recipe:check` reads the prerendered
HTML the way AnyList does and prints each ingredient line as AnyList will parse it.

Done when all three pass and every printed ingredient line reads quantity first and matches the
card (fractions included).

## 6. Show Oak, then open the PR

Show Oak the `recipe:check` output and the description, tags and notes, and wait for his OK:
once pushed, the recipe is public. Then, from an up-to-date `main`:

```bash
git checkout -b feat/recipe-<slug>
git add public/recipes
git commit -m "feat: add <recipe name> recipe"
git push -u origin feat/recipe-<slug>
gh pr create --title "feat: add <recipe name> recipe" --body "<one line: the recipe and its URL path>"
```

Merging deploys it to `https://family-meal-ten.vercel.app/recipes/<slug>`. Leave the merge to Oak
unless he asks you to merge.
