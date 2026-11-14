import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Recipe } from '../recipe.model';
import { RecipePage } from './recipe-page';

const RECIPE: Recipe = {
  slug: 'test-salad',
  name: 'Test Salad',
  description: 'Invented for tests.',
  servings: 4,
  prepMinutes: 10,
  cookMinutes: 0,
  totalMinutes: 10,
  tags: ['salad'],
  ingredients: [
    { qty: 1, unit: 'head', item: 'lettuce' },
    { qty: 0.25, unit: 'cup', item: 'tahini', group: 'For the dressing' },
    { qty: 1.5, unit: 'tablespoons', item: 'lemon juice', group: 'For the dressing' },
    { item: 'Salt, to taste' },
  ],
  steps: [{ title: 'Toss', text: 'Toss everything.', timerMinutes: 2 }],
};

describe('RecipePage', () => {
  let fixture: ComponentFixture<RecipePage>;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [RecipePage], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(RecipePage);
    fixture.componentRef.setInput('recipe', RECIPE);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('groups consecutive lines under their heading, in file order', () => {
    const lists = [...el.querySelectorAll('.ingredients ul.list')];
    expect(lists.map((l) => l.querySelectorAll('li').length)).toEqual([1, 2, 1]);
    const headings = [...el.querySelectorAll('.ingredients .group')].map((h) =>
      h.textContent!.trim(),
    );
    expect(headings).toEqual(['For the dressing']);
  });

  it('shows quantities as fractions, quantity first', () => {
    const rows = [...el.querySelectorAll('.ingredients .ing')].map((r) =>
      r.textContent!.replace(/\s+/g, ' ').trim(),
    );
    expect(rows).toEqual([
      '1 head lettuce',
      '1/4 cup tahini',
      '1 1/2 tablespoons lemon juice',
      'Salt, to taste',
    ]);
  });

  it('links Start cooking to cook mode and shows step timers', () => {
    expect(el.querySelector('a.start')!.getAttribute('href')).toBe('/recipes/test-salad/cook');
    expect(el.querySelector('.timer-hint')!.textContent).toContain('2 min');
  });
});
