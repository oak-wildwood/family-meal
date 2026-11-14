import { RenderMode, ServerRoute } from '@angular/ssr';
import manifest from '../../public/recipes/index.json';
import { RecipeSummary } from './recipes/recipe.model';

/**
 * Every route is prerendered: AnyList fetches the HTML and runs no JavaScript,
 * so JSON-LD that only exists after client rendering never reaches it.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'recipes/:slug',
    renderMode: RenderMode.Prerender,
    // A recipe missing from the manifest is never prerendered and its URL 404s.
    getPrerenderParams: async () => (manifest as RecipeSummary[]).map(({ slug }) => ({ slug })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
