import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let doc: Document;

  beforeEach(async () => {
    localStorage.removeItem('theme');
    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
    doc = TestBed.inject(DOCUMENT);
    doc.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.removeItem('theme');
    doc.documentElement.removeAttribute('data-theme');
  });

  it('cycles Auto, Light, Dark and applies each to the page', () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    expect(doc.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');

    button.click();
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    button.click();
    expect(doc.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('starts from the saved choice', () => {
    localStorage.setItem('theme', 'dark');
    const fixture = TestBed.createComponent(ThemeToggle);
    expect(fixture.componentInstance.theme()).toBe('dark');
  });
});
