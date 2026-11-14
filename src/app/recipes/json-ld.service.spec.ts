import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { JsonLdService } from './json-ld.service';

describe('JsonLdService', () => {
  let service: JsonLdService;
  let document: Document;

  beforeEach(() => {
    service = TestBed.inject(JsonLdService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => service.clear());

  const scripts = () => document.head.querySelectorAll('script[type="application/ld+json"]');

  it('adds one JSON-LD script to <head>', () => {
    service.set({ name: 'Soup' });
    expect(scripts().length).toBe(1);
    expect(JSON.parse(scripts()[0].textContent!)).toEqual({ name: 'Soup' });
  });

  it('replaces the script instead of adding a second', () => {
    service.set({ name: 'Soup' });
    service.set({ name: 'Stew' });
    expect(scripts().length).toBe(1);
    expect(JSON.parse(scripts()[0].textContent!)).toEqual({ name: 'Stew' });
  });

  it('writes no raw < into the script', () => {
    service.set({ text: '</script>' });
    expect(scripts()[0].textContent).not.toContain('<');
  });
});
