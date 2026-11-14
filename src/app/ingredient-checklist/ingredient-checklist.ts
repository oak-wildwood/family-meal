import { Component } from '@angular/core';

/**
 * EXERCISE: ingredient and step checklist (signals: signal, update).
 *
 * TODO(Oak):
 * - Tick off ingredients as they're gathered, and steps as they're done.
 * - Keep the checked state in a `signal()` (a Set of indexes, or one per list)
 *   and change it with `.update()`, never by mutating in place.
 * - Client-only state: the prerendered HTML has nothing checked.
 */
@Component({
  selector: 'app-ingredient-checklist',
  imports: [],
  templateUrl: './ingredient-checklist.html',
  styleUrl: './ingredient-checklist.css',
})
export class IngredientChecklist {}
