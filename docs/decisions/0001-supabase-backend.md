# 0001: Supabase is the backend

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

Recipes live as JSON files in `public/recipes/`, and adding one means opening a pull request
and waiting for a deploy. The next features (editing recipes in the app, a weekly meal plan and
a pantry) need data that changes at runtime and belongs to a signed-in owner, which files in a
public repo cannot hold.

## Decision

Use **Supabase** (hosted, free plan) for the backend:

- **Postgres** holds recipes, ingredients, steps, the meal plan and the pantry. The schema and
  row-level security (RLS) policies are migrations in this repo, managed with the Supabase CLI,
  and run against a local stack (`supabase start`) before the hosted project.
- **Auth** has one owner account. Owner-scoped rows carry an `owner_id`, so a household can be
  added later without reshaping the tables.
- **Storage** holds recipe photos in a public bucket.
- **Edge Functions** handle writes that need validation (see [0004](0004-recipe-submission-api-queue-later.md)).

Supabase was chosen over Firebase to learn a Postgres-based stack: SQL migrations, RLS, and a
relational model for ingredients shared across recipes and the pantry.

### Data model (first draft)

| Table | Holds |
|---|---|
| `recipes` | slug (permanent, it is the URL), name, description, servings, times, category, tags, image path, `based_on`, notes, `leftover_meals` |
| `recipe_ingredients` | recipe, position, qty, unit, display text (`item`, as today), group, `ingredient_id` |
| `recipe_steps` | recipe, position, title, text, `timer_minutes` |
| `ingredients` | standard name ("brown lentils"), `is_staple` |
| `pantry_items` | owner, ingredient, on hand, running low, use soon |
| `meal_plan_entries` | owner, date, meal (lunch or dinner), recipe, kind (cook or leftover), the cook entry a leftover comes from, cooked at |

Recipes, their ingredients and steps are public to read and owner-only to write. The pantry
and the meal plan are owner-only for both.

## Consequences

- **The anon key and project URL are public by design** and will appear in the built site. That
  is safe only while RLS is correct on every table, so every migration that adds a table adds
  its policies in the same file, with a test that an anonymous client cannot write.
- **The service-role key never reaches this repo or the browser.** It lives only in Supabase
  function secrets.
- **Free-plan limits** (about 500 MB of database, about 1 GB of storage, about 5 GB a month of
  egress) are far above what a recipe site needs. Photos are the only thing that grows; a CDN
  cache in front of them keeps egress low. A free project is restricted at its limits, never
  billed.
- **Free projects pause after about a week without activity.** A paused project breaks every
  recipe page and every AnyList import until it is restored. A scheduled job that reads the
  database every few days prevents it (see [0003](0003-host-on-doks-with-opentofu-and-helm.md)).
- **Ingredient matching needs standard names.** The display text stays as written; each line
  also points at an `ingredients` row, so the pantry and the shopping list can match
  "brown lentils, rinsed" to "brown lentils".
