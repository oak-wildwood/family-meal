import { Ingredient, Recipe } from './recipe.model';

/** Fractions a cook would write, as [numerator, denominator]. */
const FRACTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 8], [1, 4], [1, 3], [3, 8], [1, 2], [5, 8], [2, 3], [3, 4], [7, 8],
];

/** Close enough to count as that fraction: 0.33 and 0.333 both mean 1/3. */
const TOLERANCE = 0.02;

/**
 * 1.5 → "1 1/2", 0.33 → "1/3", 2 → "2". A value no common fraction is near
 * (0.1) falls back to a rounded decimal rather than inventing a fraction.
 */
export function formatQuantity(qty: number): string {
  let whole = Math.floor(qty);
  const rest = qty - whole;
  if (rest < TOLERANCE) return String(whole);
  if (1 - rest < TOLERANCE) return String(whole + 1);
  const match = FRACTIONS.find(([n, d]) => Math.abs(rest - n / d) < TOLERANCE);
  if (!match) return String(Math.round(qty * 100) / 100);
  const fraction = `${match[0]}/${match[1]}`;
  return whole === 0 ? fraction : `${whole} ${fraction}`;
}

/** Quantity first, the order AnyList parses: "1 1/2 cups brown lentils, rinsed". */
export function formatIngredient(ingredient: Ingredient): string {
  const qty = ingredient.qty === undefined ? undefined : formatQuantity(ingredient.qty);
  return [qty, ingredient.unit, ingredient.item].filter(Boolean).join(' ');
}

/** 15 → "PT15M", 90 → "PT1H30M". */
export function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ''}${m || !h ? `${m}M` : ''}`;
}

/**
 * schema.org Recipe JSON-LD. Groups are flattened (AnyList wants one string per
 * line), and notes, tags and timers are site-only.
 */
export function toJsonLd(recipe: Recipe, siteOrigin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description,
    ...(recipe.image && { image: new URL(recipe.image, siteOrigin).href }),
    recipeYield: `${recipe.servings} servings`,
    prepTime: isoDuration(recipe.prepMinutes),
    cookTime: isoDuration(recipe.cookMinutes),
    totalTime: isoDuration(recipe.totalMinutes),
    ...(recipe.category && { recipeCategory: recipe.category }),
    ...(recipe.basedOn && { isBasedOn: recipe.basedOn }),
    recipeIngredient: recipe.ingredients.map(formatIngredient),
    recipeInstructions: recipe.steps.map((step) => ({
      '@type': 'HowToStep',
      ...(step.title && { name: step.title }),
      text: step.text,
    })),
  };
}

/**
 * JSON for a <script> element. Every `<` becomes `<` (still valid JSON),
 * so a "</script>" in recipe text can't end the element early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
