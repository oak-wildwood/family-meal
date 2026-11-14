import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecipeSummary } from '../recipes/recipe.model';
import { RecipeList } from './recipe-list';

const ROWS: RecipeSummary[] = [
  {
    slug: 'dal',
    name: 'Red lentil dal',
    tags: ['vegetarian', 'soup'],
    totalMinutes: 45,
    ingredients: ['red lentils', 'ginger'],
  },
  {
    slug: 'chowder',
    name: 'Clam chowder',
    tags: ['soup', 'seafood'],
    totalMinutes: 90,
    ingredients: ['razor clams', 'bacon, diced'],
  },
  {
    slug: 'tacos',
    name: 'Black bean tacos',
    tags: ['vegetarian'],
    totalMinutes: 20,
    ingredients: ['black beans'],
  },
];

describe('RecipeList', () => {
  let fixture: ComponentFixture<RecipeList>;
  let el: HTMLElement;

  const names = () => [...el.querySelectorAll('.row-name')].map((n) => n.textContent!.trim());
  const type = async (text: string) => {
    const input = el.querySelector<HTMLInputElement>('input[type=search]')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RecipeList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(RecipeList);
    el = fixture.nativeElement;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/recipes/index.json').flush(ROWS);
    await fixture.whenStable();
  });

  it('lists every recipe with its total time', () => {
    expect(names()).toEqual(['Red lentil dal', 'Clam chowder', 'Black bean tacos']);
    expect(el.textContent).toContain('1 hr 30 min');
    expect(el.querySelector('.count')!.textContent).toContain('3 recipes');
  });

  it('builds tag chips, most-used first, with All current', () => {
    const chips = [...el.querySelectorAll('.chips .chip')];
    expect(chips.map((c) => c.textContent!.trim())).toEqual([
      'All',
      'Soup',
      'Vegetarian',
      'Seafood',
    ]);
    expect(chips[0].getAttribute('aria-current')).toBe('page');
  });

  it('filters by the tag in the URL', async () => {
    fixture.componentRef.setInput('tag', 'seafood');
    await fixture.whenStable();
    expect(names()).toEqual(['Clam chowder']);
    const current = el.querySelector('.chips [aria-current=page]')!;
    expect(current.textContent!.trim()).toBe('Seafood');
  });

  it('ignores a tag no recipe has', async () => {
    fixture.componentRef.setInput('tag', 'dessert');
    await fixture.whenStable();
    expect(names().length).toBe(3);
  });

  it('searches names, tags and ingredients, all words must match', async () => {
    await type('clams');
    expect(names()).toEqual(['Clam chowder']);
    await type('vegetarian beans');
    expect(names()).toEqual(['Black bean tacos']);
  });

  it('shows an empty state that clears the search', async () => {
    await type('pavlova');
    expect(names()).toEqual([]);
    el.querySelector<HTMLButtonElement>('.empty button')!.click();
    await fixture.whenStable();
    expect(names().length).toBe(3);
  });
});
