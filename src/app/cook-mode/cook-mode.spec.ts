import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Recipe } from '../recipes/recipe.model';
import { CookMode } from './cook-mode';

const RECIPE: Recipe = {
  slug: 'test-soup',
  name: 'Test Soup',
  description: 'Invented for tests.',
  servings: 2,
  prepMinutes: 5,
  cookMinutes: 10,
  totalMinutes: 15,
  tags: [],
  ingredients: [
    { qty: 2, unit: 'cups', item: 'water' },
    { item: 'Salt, to taste', group: 'To finish' },
  ],
  steps: [
    { text: 'Boil the water.' },
    { title: 'Simmer', text: 'Simmer for a bit.', timerMinutes: 2 },
    { text: 'Serve.' },
  ],
};

describe('CookMode', () => {
  let fixture: ComponentFixture<CookMode>;
  let el: HTMLElement;

  const button = (label: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent!.trim() === label,
    )!;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    // jsdom has <dialog> but not showModal/close; browsers do.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
    TestBed.configureTestingModule({ imports: [CookMode], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CookMode);
    fixture.componentRef.setInput('recipe', RECIPE);
    el = fixture.nativeElement;
    await settle();
  });

  afterEach(() => vi.useRealTimers());

  it('starts on step 1 with Back disabled', () => {
    expect(el.querySelector('.counter')!.textContent).toContain('1 of 3');
    expect(el.querySelector('.text')!.textContent).toContain('Boil the water.');
    expect(button('Back').disabled).toBe(true);
    expect(el.querySelector('.timer')).toBeNull();
  });

  it('moves with Next, Back and the arrow keys, and ends on Finish', async () => {
    button('Next').click();
    await settle();
    expect(el.querySelector('.label')!.textContent).toContain('Step 2 · Simmer');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await settle();
    expect(el.querySelector('.counter')!.textContent).toContain('3 of 3');
    expect(el.querySelector('a.btn-primary')!.textContent).toContain('Finish');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await settle();
    expect(el.querySelector('.counter')!.textContent).toContain('2 of 3');
  });

  it('runs a step timer that keeps going on other steps', async () => {
    button('Next').click();
    await settle();
    expect(el.querySelector('.timer-time')!.textContent).toBe('2:00');

    button('Start').click();
    await settle();
    vi.advanceTimersByTime(30_000);
    await settle();
    expect(el.querySelector('.timer-time')!.textContent).toBe('1:30');

    button('Next').click();
    await settle();
    expect(el.querySelector('.other')!.textContent).toContain('Simmer');

    vi.advanceTimersByTime(90_000);
    await settle();
    expect(el.querySelector('.other')!.textContent).toContain("Time's up");
  });

  it('pauses and resumes', async () => {
    button('Next').click();
    await settle();
    button('Start').click();
    vi.advanceTimersByTime(10_000);
    await settle();
    button('Pause').click();
    vi.advanceTimersByTime(60_000);
    await settle();
    expect(el.querySelector('.timer-time')!.textContent).toBe('1:50');
    expect(button('Resume')).toBeTruthy();
  });

  it('opens the ingredients over the current step and closes back to it', async () => {
    button('Next').click();
    await settle();
    const sheet = el.querySelector('dialog')!;
    expect(sheet.open).toBe(false);

    button('Ingredients').click();
    await settle();
    expect(sheet.open).toBe(true);
    expect(sheet.textContent).toContain('2 cups');
    expect(sheet.textContent).toContain('water');
    expect(sheet.querySelector('.sheet-group')!.textContent).toContain('To finish');

    // Arrow keys belong to the sheet while it's open.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await settle();
    expect(el.querySelector('.counter')!.textContent).toContain('2 of 3');

    el.querySelector<HTMLButtonElement>('[aria-label="Close ingredients"]')!.click();
    await settle();
    expect(sheet.open).toBe(false);
    expect(el.querySelector('.counter')!.textContent).toContain('2 of 3');
  });
});
