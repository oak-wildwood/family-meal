import { spawnSync } from 'node:child_process';

/**
 * supabase/seed.sql is generated from the recipe files, and `supabase db reset` runs it.
 * A stale seed means the local database lacks a recipe, and a recipe line with no standard
 * ingredient name stops the generator. `--check` covers both.
 */
describe('supabase seed', () => {
  it('matches the recipe files (run `npm run recipes:seed` if this fails)', () => {
    // Vitest runs from the workspace root.
    const result = spawnSync(process.execPath, ['scripts/import-recipes.mjs', '--check'], {
      encoding: 'utf8',
    });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
});
