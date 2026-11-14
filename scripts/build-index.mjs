#!/usr/bin/env node
// Rebuilds public/recipes/index.json from the recipe files, so the manifest
// can't drift from them. getPrerenderParams and the Home page both read it.
//
//   node scripts/build-index.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = 'public/recipes';

const rows = readdirSync(DIR)
  .filter((name) => name.endsWith('.json') && name !== 'index.json')
  .map((name) => JSON.parse(readFileSync(`${DIR}/${name}`, 'utf8')))
  .map((r) => ({
    slug: r.slug,
    name: r.name,
    tags: r.tags,
    totalMinutes: r.totalMinutes,
    // Item text only, for "search recipes or ingredients" on Home.
    ingredients: r.ingredients.map((i) => i.item),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(`${DIR}/index.json`, JSON.stringify(rows, null, 2) + '\n');
console.log(`Wrote ${rows.length} recipes to ${DIR}/index.json`);
