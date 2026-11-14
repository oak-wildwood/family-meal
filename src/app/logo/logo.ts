import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The dinner-plate mark, from the canvas's Logo board. Decorative: it always
 * sits beside the "Family Meal" wordmark, which carries the name. Colored by
 * --mark, a darker accent in light mode so it clears 7:1 on the page.
 */
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="2.6" />
      <circle cx="16" cy="16" r="4.5" fill="currentColor" />
      <path
        d="M2 5v5M4.5 5v5M2 10h2.5M3.25 10v17"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M29.5 5C27.4 7 27.4 12.5 29.5 14.5V27"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      color: var(--mark);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  readonly size = input(34);
}
