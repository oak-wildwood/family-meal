import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatMinutes, sourceHost, tagLabel } from '../display';
import { formatIngredient, formatQuantity, isUrl } from '../recipe-json-ld';
import { Ingredient, Recipe } from '../recipe.model';

interface IngredientGroup {
  name?: string;
  items: Ingredient[];
}

/**
 * The recipe page. Renders from the same Recipe as the JSON-LD (set in the
 * resolver, never here) and is fully readable prerendered, with no JavaScript.
 * Ingredients show at base servings; the scaler and checkmarks are Oak's
 * practice shells and drop into the marked slots.
 */
@Component({
  selector: 'app-recipe-page',
  imports: [RouterLink],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePage {
  /** Bound from the route's `recipe` resolver via withComponentInputBinding. */
  readonly recipe = input.required<Recipe>();

  /** Consecutive lines that share a `group` heading, in file order. */
  protected readonly groups = computed(() => {
    const groups: IngredientGroup[] = [];
    for (const item of this.recipe().ingredients) {
      const last = groups.at(-1);
      if (last && last.name === item.group) last.items.push(item);
      else groups.push({ name: item.group, items: [item] });
    }
    return groups;
  });

  protected readonly formatIngredient = formatIngredient;
  protected readonly formatQuantity = formatQuantity;
  protected readonly formatMinutes = formatMinutes;
  protected readonly tagLabel = tagLabel;
  protected readonly sourceHost = sourceHost;
  protected readonly isUrl = isUrl;
}
