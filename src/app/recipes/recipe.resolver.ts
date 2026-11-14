import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ResolveFn } from '@angular/router';
import { tap } from 'rxjs';
import { SITE_ORIGIN } from '../site-origin';
import { JsonLdService } from './json-ld.service';
import { toJsonLd } from './recipe-json-ld';
import { Recipe } from './recipe.model';

/**
 * Fetches the recipe and sets JSON-LD, title and description before the route
 * activates. Doing it here, not in the component, is what puts the JSON-LD in
 * the prerendered HTML that AnyList reads.
 */
export const recipeResolver: ResolveFn<Recipe> = (route) => {
  const jsonLd = inject(JsonLdService);
  const title = inject(Title);
  const meta = inject(Meta);
  const origin = inject(SITE_ORIGIN);
  const slug = route.paramMap.get('slug')!;

  return inject(HttpClient)
    .get<Recipe>(`/recipes/${slug}.json`)
    .pipe(
      tap((recipe) => {
        jsonLd.set(toJsonLd(recipe, origin));
        title.setTitle(`${recipe.name} | Family Meal`);
        meta.updateTag({ name: 'description', content: recipe.description });
        if (recipe.image) {
          meta.updateTag({ property: 'og:image', content: new URL(recipe.image, origin).href });
        } else {
          meta.removeTag("property='og:image'");
        }
      }),
    );
};
