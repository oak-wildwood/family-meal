import { Component } from '@angular/core';

/**
 * EXERCISE: servings scaler (signals: input, model, computed).
 *
 * TODO(Oak):
 * - Take the recipe's ingredients and base servings as `input()`s.
 * - Hold the chosen servings in a `model()`, so a parent can two-way bind it.
 * - Derive the scaled ingredient lines with `computed()`; reuse formatQuantity /
 *   formatIngredient from recipes/recipe-json-ld.ts so 0.5 still shows as 1/2.
 * - Only the visible list scales. The JSON-LD always uses the base servings.
 * - Markup and styles are ready: the `.stepper` classes in src/styles.css match the
 *   canvas, and recipe-page.html marks the SLOT(Oak) this replaces. Clamp to 1–12.
 */
@Component({
  selector: 'app-servings-scaler',
  imports: [],
  templateUrl: './servings-scaler.html',
  styleUrl: './servings-scaler.css',
})
export class ServingsScaler {}
