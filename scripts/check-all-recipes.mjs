#!/usr/bin/env node
// Runs check-recipe.mjs for every recipe in public/recipes/index.json.
// Run after `npx ng build`. Exits 1 if any recipe fails.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const slugs = JSON.parse(readFileSync('public/recipes/index.json', 'utf8')).map((row) => row.slug);
let failed = 0;
for (const slug of slugs) {
  const { status } = spawnSync(process.execPath, ['scripts/check-recipe.mjs', slug], { stdio: 'inherit' });
  if (status !== 0) failed++;
}
console.log(`${slugs.length - failed}/${slugs.length} recipes pass`);
process.exit(failed ? 1 : 0);
