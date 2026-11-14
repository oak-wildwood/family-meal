import { anyRunning, pause, remainingMs, reset, settle, start } from './cook-timers';

const FULL = 10 * 60_000;

describe('cook timers', () => {
  it('starts at the full time and counts down from the end time', () => {
    const t = start({}, 1, FULL, 1_000);
    expect(remainingMs(t[1], FULL, 1_000)).toBe(FULL);
    expect(remainingMs(t[1], FULL, 61_000)).toBe(FULL - 60_000);
  });

  it('shows the full time for a step that was never started', () => {
    expect(remainingMs(undefined, FULL, 123)).toBe(FULL);
  });

  it('pauses and resumes where it left off', () => {
    let t = start({}, 0, FULL, 0);
    t = pause(t, 0, 60_000);
    expect(remainingMs(t[0], FULL, 999_999)).toBe(FULL - 60_000);
    t = start(t, 0, FULL, 100_000);
    expect(remainingMs(t[0], FULL, 100_000)).toBe(FULL - 60_000);
  });

  it('keeps timers on other steps independent', () => {
    let t = start({}, 1, FULL, 0);
    t = start(t, 3, 5 * 60_000, 30_000);
    t = pause(t, 3, 60_000);
    expect(t[1].status).toBe('running');
    expect(t[3].status).toBe('paused');
  });

  it('settles finished timers once and reports them', () => {
    const t = start({}, 2, FULL, 0);
    expect(settle(t, FULL - 1).finished).toEqual([]);
    const done = settle(t, FULL);
    expect(done.finished).toEqual([2]);
    expect(done.timers[2]).toEqual({ status: 'done' });
    expect(settle(done.timers, FULL * 2).finished).toEqual([]);
    expect(anyRunning(done.timers)).toBe(false);
  });

  it('restarts a done timer from the full time', () => {
    const t = start({ 0: { status: 'done' } }, 0, FULL, 5);
    expect(remainingMs(t[0], FULL, 5)).toBe(FULL);
  });

  it('resets to untouched', () => {
    expect(reset(start({}, 0, FULL, 0), 0)).toEqual({});
  });
});
