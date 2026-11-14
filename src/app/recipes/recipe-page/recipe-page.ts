import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../logo/logo';
import { SITE_ORIGIN } from '../../site-origin';
import { formatMinutes, groupIngredients, sourceHost, tagLabel } from '../display';
import { formatQuantity, isUrl } from '../recipe-json-ld';
import { Recipe } from '../recipe.model';

/**
 * The recipe page. Renders from the same Recipe as the JSON-LD (set in the
 * resolver, never here) and is fully readable prerendered, with no JavaScript.
 * Ingredients show at base servings; the scaler and checkmarks are Oak's
 * practice shells and drop into the marked slots.
 *
 * Share hands the page's public URL to the phone's share sheet, which is how a
 * recipe gets to AnyList's import, and the only way to do it from the installed
 * app, which has no address bar.
 */
@Component({
  selector: 'app-recipe-page',
  imports: [RouterLink, Logo],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePage {
  /** Bound from the route's `recipe` resolver via withComponentInputBinding. */
  readonly recipe = input.required<Recipe>();

  private readonly origin = inject(SITE_ORIGIN);
  private copiedTimer?: ReturnType<typeof setTimeout>;

  /** The public URL, not the current one, so a preview or local build still shares the real page. */
  protected readonly shareUrl = computed(() => `${this.origin}/recipes/${this.recipe().slug}`);
  /** True for a moment after the link is copied, where there's no share sheet. */
  protected readonly copied = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.copiedTimer));
  }

  protected async share(): Promise<void> {
    const url = this.shareUrl();
    if (navigator.share) {
      try {
        // Title and URL only: some share targets fold extra text into the URL field.
        await navigator.share({ title: this.recipe().name, url });
      } catch {
        // Closing the share sheet rejects too; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  protected readonly groups = computed(() => groupIngredients(this.recipe().ingredients));

  // The template splits each line the way formatIngredient orders it (quantity,
  // unit, item) so the quantity can be bold; the JSON-LD still uses formatIngredient.
  protected readonly formatQuantity = formatQuantity;
  protected readonly formatMinutes = formatMinutes;
  protected readonly tagLabel = tagLabel;
  protected readonly sourceHost = sourceHost;
  protected readonly isUrl = isUrl;
}
