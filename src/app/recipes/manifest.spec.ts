import { readFileSync, readdirSync } from 'node:fs';
import manifest from '../../../public/recipes/index.json';
import { RecipeSummary } from './recipe.model';

/**
 * getPrerenderParams reads the manifest, so a recipe file missing from it is
 * never prerendered, and a manifest row without a file fails the build.
 */

// Vitest runs from the workspace root.
const DIR = 'public/recipes';

const recipes = readdirSync(DIR)
  .filter((name) => name.endsWith('.json') && name !== 'index.json')
  .map((name) => ({
    file: name.replace(/\.json$/, ''),
    recipe: JSON.parse(readFileSync(`${DIR}/${name}`, 'utf8')) as RecipeSummary,
  }));

const rows = manifest as RecipeSummary[];

describe('recipe manifest', () => {
  it('lists exactly the recipe files', () => {
    expect(rows.map((r) => r.slug).sort()).toEqual(recipes.map((r) => r.file).sort());
  });

  it('matches each file on slug, name and tags', () => {
    for (const { file, recipe } of recipes) {
      expect(recipe.slug).toBe(file);
      expect(rows.find((r) => r.slug === file)).toEqual({
        slug: recipe.slug,
        name: recipe.name,
        tags: recipe.tags,
      });
    }
  });
});
