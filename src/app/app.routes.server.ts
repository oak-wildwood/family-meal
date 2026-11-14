import { RenderMode, ServerRoute } from '@angular/ssr';
import manifest from '../../public/recipes/index.json';
import { RecipeSummary } from './recipes/recipe.model';

/**
 * Every route is prerendered: AnyList fetches the HTML and runs no JavaScript,
 * so JSON-LD that only exists after client rendering never reaches it.
 */
const recipeParams = async () => (manifest as RecipeSummary[]).map(({ slug }) => ({ slug }));

export const serverRoutes: ServerRoute[] = [
  {
    path: 'recipes/:slug',
    renderMode: RenderMode.Prerender,
    // A recipe missing from the manifest is never prerendered and its URL 404s.
    getPrerenderParams: recipeParams,
  },
  { path: 'recipes/:slug/cook', renderMode: RenderMode.Prerender, getPrerenderParams: recipeParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
