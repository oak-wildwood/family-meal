/**
 * Per-step countdown timers, keyed by step index. Pure functions over plain
 * state so cook mode stays a thin signal wrapper and the rules are testable.
 *
 * A running timer stores when it ends, not how much is left, so a phone that
 * throttles a background tab still shows the right time when it comes back.
 */
export type TimerState =
  | { status: 'running'; endsAt: number }
  | { status: 'paused'; remainingMs: number }
  | { status: 'done' };

export type Timers = Readonly<Record<number, TimerState>>;

export function remainingMs(state: TimerState | undefined, fullMs: number, now: number): number {
  if (!state) return fullMs;
  switch (state.status) {
    case 'running':
      return Math.max(0, state.endsAt - now);
    case 'paused':
      return state.remainingMs;
    case 'done':
      return 0;
  }
}

export function start(timers: Timers, step: number, fullMs: number, now: number): Timers {
  const left = remainingMs(timers[step], fullMs, now);
  return { ...timers, [step]: { status: 'running', endsAt: now + (left || fullMs) } };
}

export function pause(timers: Timers, step: number, now: number): Timers {
  const t = timers[step];
  if (t?.status !== 'running') return timers;
  return { ...timers, [step]: { status: 'paused', remainingMs: Math.max(0, t.endsAt - now) } };
}

export function reset(timers: Timers, step: number): Timers {
  const { [step]: _, ...rest } = timers;
  return rest;
}

/** Marks every running timer that has reached zero as done; returns the steps that just finished. */
export function settle(timers: Timers, now: number): { timers: Timers; finished: number[] } {
  const finished = Object.entries(timers)
    .filter(([, t]) => t.status === 'running' && t.endsAt <= now)
    .map(([k]) => Number(k));
  if (!finished.length) return { timers, finished };
  const next: Record<number, TimerState> = { ...timers };
  for (const k of finished) next[k] = { status: 'done' };
  return { timers: next, finished };
}

export function anyRunning(timers: Timers): boolean {
  return Object.values(timers).some((t) => t.status === 'running');
}
