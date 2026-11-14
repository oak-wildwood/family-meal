import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

/** `auto` follows the phone's appearance setting; `light` and `dark` override it. */
export type Theme = 'auto' | 'light' | 'dark';

const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL: Record<Theme, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' };
const STORAGE_KEY = 'theme';

/** Reads the saved choice. Storage can be blocked (private windows), so failures mean `auto`. */
function readSaved(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

function writeSaved(theme: Theme): void {
  try {
    if (theme === 'auto') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {
    // Blocked storage: the choice lasts until the page reloads.
  }
}

/** Cycles Auto, Light, Dark. The index.html script applies the saved choice before first paint. */
@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly doc = inject(DOCUMENT);

  readonly theme = signal<Theme>(readSaved());
  readonly label = computed(() => LABEL[this.theme()]);

  toggle(): void {
    const next = NEXT[this.theme()];
    this.theme.set(next);
    writeSaved(next);

    const root = this.doc.documentElement;
    if (next === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', next);
    }
  }
}
