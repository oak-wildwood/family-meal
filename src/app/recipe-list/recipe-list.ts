import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';
import { formatMinutes, tagLabel } from '../recipes/display';
import { RecipeSummary } from '../recipes/recipe.model';

/**
 * Home: every recipe, with search and a tag filter. Prerendered with the full
 * list (httpResource holds the prerender until the manifest loads), so it works
 * before hydration; search is client-only on top.
 */
@Component({
  selector: 'app-recipe-list',
  imports: [RouterLink, Logo],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeList {
  private readonly router = inject(Router);

  /** `?tag=soup`, bound by withComponentInputBinding. Tag chips are links, so the filter is in the URL. */
  readonly tag = input<string>();

  protected readonly recipes = httpResource<RecipeSummary[]>(() => '/recipes/index.json', {
    defaultValue: [],
  });
  protected readonly query = signal('');

  /** Every tag in use, most-used first, then alphabetical. */
  protected readonly tags = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.recipes.value()) {
      for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  });

  /** The URL's tag, or null when it names a tag no recipe has. */
  protected readonly selectedTag = computed(() => {
    const t = this.tag();
    return t && this.tags().includes(t) ? t : null;
  });

  protected readonly visible = computed(() => {
    const tag = this.selectedTag();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.recipes
      .value()
      .filter((r) => !tag || r.tags.includes(tag))
      .filter((r) => {
        const haystack = [r.name, ...r.tags, ...r.ingredients].join(' ').toLowerCase();
        return words.every((w) => haystack.includes(w));
      });
  });

  protected readonly countLabel = computed(() => {
    const n = this.visible().length;
    return n === 1 ? '1 recipe' : `${n} recipes`;
  });

  protected readonly formatMinutes = formatMinutes;
  protected readonly tagLabel = tagLabel;

  protected clear(): void {
    this.query.set('');
    void this.router.navigate(['/']);
  }
}
