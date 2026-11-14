import { DOCUMENT, Injectable, RendererFactory2, inject } from '@angular/core';
import { serializeJsonLd } from './recipe-json-ld';

const SCRIPT_ID = 'recipe-json-ld';

/**
 * Owns the one JSON-LD <script> in <head>. Angular templates strip <script>,
 * so this is the only way JSON-LD reaches the page. Call it from a resolver,
 * so it runs before the route activates and lands in the prerendered HTML.
 */
@Injectable({ providedIn: 'root' })
export class JsonLdService {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);

  set(data: unknown): void {
    let script = this.document.getElementById(SCRIPT_ID);
    if (!script) {
      script = this.renderer.createElement('script');
      this.renderer.setAttribute(script, 'id', SCRIPT_ID);
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.appendChild(this.document.head, script);
    }
    this.renderer.setProperty(script, 'textContent', serializeJsonLd(data));
  }

  clear(): void {
    const script = this.document.getElementById(SCRIPT_ID);
    if (script) this.renderer.removeChild(this.document.head, script);
  }
}
