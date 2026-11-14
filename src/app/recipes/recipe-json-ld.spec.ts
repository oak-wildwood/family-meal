import seed from '../../../public/recipes/spike-test-lentil-soup.json';
import { Recipe } from './recipe.model';
import { formatIngredient, formatQuantity, isoDuration, serializeJsonLd, toJsonLd } from './recipe-json-ld';

const ORIGIN = 'https://example.test';

/** The JSON-LD from spike variant A (issue #1), which AnyList imported. */
const VARIANT_A = {
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Spike Test Lentil Soup',
  description: 'A simple lentil soup, used only to test recipe import.',
  recipeYield: '4 servings',
  prepTime: 'PT15M',
  cookTime: 'PT35M',
  totalTime: 'PT50M',
  recipeCategory: 'Soup',
  recipeIngredient: [
    '1 tablespoon olive oil',
    '1 yellow onion, diced',
    '2 carrots, peeled and diced',
    '3 cloves garlic, minced',
    '1 teaspoon ground cumin',
    '1 1/2 cups brown lentils, rinsed',
    '6 cups vegetable broth',
    '1 can (14 oz) diced tomatoes',
    '2 cups baby spinach',
    '1 tablespoon lemon juice',
    'Salt and black pepper, to taste',
  ],
  recipeInstructions: [
    { '@type': 'HowToStep', text: 'Heat the olive oil in a large pot over medium heat. Cook the onion and carrots for 6 to 8 minutes, until soft.' },
    { '@type': 'HowToStep', text: 'Stir in the garlic and cumin and cook for 1 minute, until fragrant.' },
    { '@type': 'HowToStep', text: 'Add the lentils, broth, and tomatoes. Bring to a boil, then reduce the heat and simmer for 25 to 30 minutes, until the lentils are tender.' },
    { '@type': 'HowToStep', text: 'Stir in the spinach until wilted. Add the lemon juice, then season with salt and pepper.' },
  ],
};

const recipe = seed as Recipe;

describe('toJsonLd', () => {
  it('builds exactly the JSON-LD that passed the AnyList spike', () => {
    const { image, ...withoutImage } = recipe;
    expect(toJsonLd(withoutImage, ORIGIN)).toEqual(VARIANT_A);
  });

  it('adds the seed image as an absolute URL, as in spike variant D', () => {
    expect(toJsonLd(recipe, ORIGIN)).toEqual({
      ...VARIANT_A,
      image: 'https://example.test/recipes/images/spike-test-lentil-soup.jpg',
    });
  });

  it('flattens ingredient groups into one line each, in order', () => {
    const grouped: Recipe = {
      ...recipe,
      ingredients: [
        { qty: 1, unit: 'cup', item: 'rice', group: 'Base' },
        { qty: 2, unit: 'tablespoons', item: 'soy sauce', group: 'Sauce' },
      ],
    };
    expect(toJsonLd(grouped, ORIGIN)['recipeIngredient']).toEqual(['1 cup rice', '2 tablespoons soy sauce']);
  });

  it('leaves site-only fields out', () => {
    const withExtras: Recipe = { ...recipe, notes: ['Freezes well.'] };
    const json = JSON.stringify(toJsonLd(withExtras, ORIGIN));
    expect(json).not.toContain('Freezes well');
    expect(json).not.toContain('timerMinutes');
    expect(json).not.toContain('vegetarian');
  });

  it('emits a step title as the HowToStep name', () => {
    const titled: Recipe = { ...recipe, steps: [{ title: 'Sauté', text: 'Cook the onion.' }] };
    expect(toJsonLd(titled, ORIGIN)['recipeInstructions']).toEqual([
      { '@type': 'HowToStep', name: 'Sauté', text: 'Cook the onion.' },
    ]);
  });

  it('makes the image URL absolute', () => {
    const withImage: Recipe = { ...recipe, image: '/recipes/images/soup.jpg' };
    expect(toJsonLd(withImage, ORIGIN)['image']).toBe('https://example.test/recipes/images/soup.jpg');
  });
});

describe('formatQuantity', () => {
  it.each([
    [2, '2'],
    [0.5, '1/2'],
    [0.33, '1/3'],
    [0.333, '1/3'],
    // Card decimals like 0.3 tsp are converted to 0.333 by the add-recipe skill; the
    // formatter stays strict so 0.1 doesn't become 1/8.
    [0.3, '0.3'],
    [0.67, '2/3'],
    [0.25, '1/4'],
    [0.75, '3/4'],
    [0.125, '1/8'],
    [1.5, '1 1/2'],
    [2.25, '2 1/4'],
    [0.999, '1'],
    [0.1, '0.1'],
  ])('%s → %s', (qty, expected) => {
    expect(formatQuantity(qty)).toBe(expected);
  });
});

describe('formatIngredient', () => {
  it('puts quantity, then unit, then item', () => {
    expect(formatIngredient({ qty: 1.5, unit: 'cups', item: 'brown lentils, rinsed' })).toBe(
      '1 1/2 cups brown lentils, rinsed',
    );
  });

  it('skips a missing quantity or unit', () => {
    expect(formatIngredient({ item: 'Salt, to taste' })).toBe('Salt, to taste');
    expect(formatIngredient({ qty: 2, item: 'carrots' })).toBe('2 carrots');
  });
});

describe('isoDuration', () => {
  it.each([
    [15, 'PT15M'],
    [60, 'PT1H'],
    [90, 'PT1H30M'],
    [0, 'PT0M'],
  ])('%s minutes → %s', (minutes, expected) => {
    expect(isoDuration(minutes)).toBe(expected);
  });
});

describe('serializeJsonLd', () => {
  it('escapes every < so recipe text cannot close the script element', () => {
    const out = serializeJsonLd({ text: 'Stir </script><script>alert(1)</script> well & <serve>' });
    expect(out).not.toContain('<');
    expect(out).toContain('\\u003c/script>');
    expect(JSON.parse(out).text).toBe('Stir </script><script>alert(1)</script> well & <serve>');
  });
});
