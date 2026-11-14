#!/usr/bin/env node
// Checks one recipe's prerendered page the way AnyList sees it: the built HTML,
// no JavaScript. Run after `npx ng build`. Exits 1 on any failure.
//
//   node scripts/check-recipe.mjs <slug>
import { existsSync, readFileSync } from 'node:fs';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: check-recipe.mjs <slug>');
  process.exit(2);
}

const DIST = 'dist/family-meal/browser';
const failures = [];
const check = (ok, message) => ok || failures.push(message);

const recipePath = `public/recipes/${slug}.json`;
if (!existsSync(recipePath)) {
  console.error(`FAIL: ${recipePath} not found`);
  process.exit(1);
}
const recipe = JSON.parse(readFileSync(recipePath, 'utf8'));
const manifest = JSON.parse(readFileSync('public/recipes/index.json', 'utf8'));
check(manifest.some((row) => row.slug === slug), `${slug} is missing from public/recipes/index.json`);

const htmlPath = `${DIST}/recipes/${slug}/index.html`;
if (!existsSync(htmlPath)) {
  console.error(`FAIL: ${htmlPath} not found. Run npx ng build first; is the slug in the manifest?`);
  process.exit(1);
}
const html = readFileSync(htmlPath, 'utf8');

const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
check(blocks.length === 1, `expected 1 JSON-LD block, found ${blocks.length}`);
const raw = blocks[0]?.[1] ?? '{}';
check(!raw.includes('<'), 'raw < inside the JSON-LD block');

const ld = JSON.parse(raw);
check(ld['@type'] === 'Recipe', `@type is ${ld['@type']}`);
check(ld.name === recipe.name, 'name differs from the recipe file');
check(ld.recipeIngredient?.length === recipe.ingredients.length,
  `${ld.recipeIngredient?.length} ingredient lines, recipe file has ${recipe.ingredients.length}`);
check(ld.recipeInstructions?.length === recipe.steps.length,
  `${ld.recipeInstructions?.length} steps, recipe file has ${recipe.steps.length}`);
check(ld.recipeInstructions?.every((s) => s['@type'] === 'HowToStep'), 'a step is not a HowToStep');
for (const key of ['prepTime', 'cookTime', 'totalTime']) {
  check(/^PT(\d+H)?(\d+M)?$/.test(ld[key] ?? ''), `${key} is ${ld[key]}, not ISO 8601`);
}
check(/<meta name="robots" content="noindex"/.test(html), 'noindex meta missing');

if (recipe.image) {
  check(/^https:\/\//.test(ld.image ?? ''), `image is ${ld.image}, not an absolute https URL`);
  check(existsSync(`${DIST}${recipe.image}`), `${recipe.image} is not in the build output`);
}

console.log(`${ld.name}: ${ld.recipeYield}, prep ${ld.prepTime}, cook ${ld.cookTime}, total ${ld.totalTime}`);
console.log('Ingredient lines as AnyList will read them:');
for (const line of ld.recipeIngredient ?? []) console.log(`  - ${line}`);
console.log(`Steps: ${ld.recipeInstructions?.length}${ld.image ? `, image ${ld.image}` : ', no image'}`);

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(1);
}
console.log('OK');
