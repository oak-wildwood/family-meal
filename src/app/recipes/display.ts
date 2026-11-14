/** Display helpers for the visible page. Never used for JSON-LD (that's recipe-json-ld.ts). */

/** 45 → "45 min", 60 → "1 hr", 210 → "3 hr 30 min". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** A countdown: 1500000 ms → "25:00", 3725000 → "1:02:05". Rounds up, so it never shows 0:00 early. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Tags are stored lowercase ("make-ahead"); shown as "Make-ahead". */
export function tagLabel(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** "https://www.example.com/soup" → "example.com". A malformed URL comes back as is rather than failing the prerender. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
