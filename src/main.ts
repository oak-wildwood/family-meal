import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// Installable + offline (public/sw.js). Not under `ng serve`, where a cached
// page would hide the change you just made.
if (!isDevMode() && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      // Save any recipe added since the worker installed.
      (registration.active ?? navigator.serviceWorker.controller)?.postMessage('save-recipes');
    } catch (err) {
      console.error('Service worker registration failed', err);
    }
  });
}
