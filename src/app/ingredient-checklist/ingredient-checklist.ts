import { Component } from '@angular/core';

/**
 * EXERCISE: ingredient and step checklist (signals: signal, update).
 *
 * TODO(Oak):
 * - Tick off ingredients as they're gathered, and steps as they're done.
 * - Keep the checked state in a `signal()` (a Set of indexes, or one per list)
 *   and change it with `.update()`, never by mutating in place.
 * - Client-only state: the prerendered HTML has nothing checked.
 * - Markup and styles are ready: see the `.check` comment in src/styles.css
 *   (rows become <button class="check" [attr.aria-pressed]>), and the
 *   SLOT(Oak) in recipe-page.html. Keep the ingredient groups and the
 *   "3 of 13 ready" / "2 of 7 done" counts from the canvas.
 */
@Component({
  selector: 'app-ingredient-checklist',
  imports: [],
  templateUrl: './ingredient-checklist.html',
  styleUrl: './ingredient-checklist.css',
})
export class IngredientChecklist {}
