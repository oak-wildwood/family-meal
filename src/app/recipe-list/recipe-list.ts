import { Component } from '@angular/core';

/**
 * EXERCISE: recipe list with a tag filter (httpResource, linkedSignal).
 *
 * TODO(Oak):
 * - Load /recipes/index.json (RecipeSummary[] from recipes/recipe.model.ts) with
 *   `httpResource()`, and show loading and error states.
 * - Hold the selected tag in a `linkedSignal()` that resets when the loaded
 *   list no longer has that tag.
 * - Link each recipe to /recipes/<slug>.
 * - The spec will need provideHttpClient() and provideHttpClientTesting() then.
 */
@Component({
  selector: 'app-recipe-list',
  imports: [],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css',
})
export class RecipeList {}
