import { Component, input } from '@angular/core';
import { formatIngredient } from '../recipe-json-ld';
import { Recipe } from '../recipe.model';

/** Minimal, unstyled page. Renders from the same Recipe as the JSON-LD. */
@Component({
  selector: 'app-recipe-page',
  templateUrl: './recipe-page.html',
})
export class RecipePage {
  /** Bound from the route's `recipe` resolver via withComponentInputBinding. */
  readonly recipe = input.required<Recipe>();
  protected readonly formatIngredient = formatIngredient;
}
