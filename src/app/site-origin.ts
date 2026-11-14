import { InjectionToken } from '@angular/core';

/**
 * Absolute origin for URLs that leave the site (the JSON-LD `image`). An
 * importer fetching server-side has nothing to resolve a relative URL against.
 */
export const SITE_ORIGIN = new InjectionToken<string>('SITE_ORIGIN', {
  providedIn: 'root',
  factory: () => 'https://family-meal-ten.vercel.app',
});
