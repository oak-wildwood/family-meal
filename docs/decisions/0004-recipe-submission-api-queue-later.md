# 0004: Recipes arrive through an API, shaped so a queue can go behind it later

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

The `add-recipe` skill turns a Claude recipe card into JSON, runs `recipe:check`, and opens a
pull request. With recipes in Supabase ([0001](0001-supabase-backend.md)) and pages rendered
from it ([0002](0002-angular-ssr-from-the-database.md)), the pull request is no longer needed.
A message queue (Supabase Queues/pgmq, or Kafka) was considered and is more than one owner
adding a few recipes a week needs today.

## Decision

- **The skill POSTs to a Supabase Edge Function, `submit-recipe`.**
- **The request body is a versioned event**, not a bare row:

  ```json
  { "type": "RecipeSubmitted", "version": 1, "submittedAt": "2026-11-26T18:00:00Z", "recipe": { "...": "the Recipe shape" } }
  ```

- **The function validates the recipe** with the same rules `recipe:check` enforces, uploads the
  photo to Storage, upserts the standard ingredient names, and writes the recipe in one
  transaction. It answers synchronously with the recipe's URL, or with the validation errors.
- **The skill assigns each ingredient line's standard name** ("brown lentils, rinsed" →
  "brown lentils") before sending, since it is already reading the recipe. The admin edit screen
  can correct a bad match.
- **The function authenticates the skill with a submit secret**, kept in Supabase function
  secrets and on the owner's machine, never in this repo.
- **The slug stays permanent.** Submitting an existing slug is an error unless the request says
  it is an update.

## Consequences

- No pull request or deploy per recipe; a new recipe is live as soon as the function returns.
- Recipe content no longer goes through review in a public pull request, so the skill's
  public-content checks (nothing personal, own words, source linked) become the only gate.
- **Adding a queue later changes only the server side:** the function enqueues the same event
  (pgmq) and a worker does what the function does today. The skill and the event shape stay
  as they are, and the same event could later go to Kafka.
- The validation rules exist twice (the `recipe:check` script and the function) unless they move
  into one shared module, which the implementation should do.
