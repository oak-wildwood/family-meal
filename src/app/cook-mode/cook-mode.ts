import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { formatClock } from '../recipes/display';
import { Recipe } from '../recipes/recipe.model';
import * as T from './cook-timers';

/**
 * One step at a time, big enough to read from the counter. Everything here is
 * client-side on top of the prerendered page; the JSON-LD still comes from the
 * route resolver.
 *
 * Timers belong to their step and keep running when you move on, since "roast
 * 25 minutes" usually overlaps the next steps. A strip shows timers on other steps.
 */
@Component({
  selector: 'app-cook-mode',
  imports: [RouterLink],
  templateUrl: './cook-mode.html',
  styleUrl: './cook-mode.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class CookMode {
  private readonly document = inject(DOCUMENT);

  /** Bound from the route's `recipe` resolver via withComponentInputBinding. */
  readonly recipe = input.required<Recipe>();

  protected readonly index = signal(0);
  protected readonly timers = signal<T.Timers>({});
  private readonly now = signal(Date.now());
  /** Set once the browser grants a screen wake lock. */
  protected readonly screenStaysOn = signal(false);

  protected readonly count = computed(() => this.recipe().steps.length);
  protected readonly step = computed(() => this.recipe().steps[this.index()]);
  protected readonly atFirst = computed(() => this.index() === 0);
  protected readonly atLast = computed(() => this.index() === this.count() - 1);

  /** The current step's timer, or null when the step has none. */
  protected readonly timer = computed(() => {
    const minutes = this.step().timerMinutes;
    return minutes ? this.timerView(this.index(), minutes) : null;
  });

  /** Timers on other steps that are running or just finished. */
  protected readonly otherTimers = computed(() =>
    Object.entries(this.timers())
      .map(([k, t]) => ({ step: Number(k), state: t }))
      .filter(({ step, state }) => step !== this.index() && state.status !== 'paused')
      .map(({ step }) => this.timerView(step, this.recipe().steps[step].timerMinutes ?? 0)),
  );

  private interval?: ReturnType<typeof setInterval>;
  private audio?: AudioContext;
  private wakeLock?: WakeLockSentinel;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      void this.requestWakeLock();
      const onVisible = () => {
        // The browser drops the lock when the page is hidden; take it back.
        if (this.document.visibilityState === 'visible') {
          void this.requestWakeLock();
          this.tick();
        }
      };
      this.document.addEventListener('visibilitychange', onVisible);
      destroyRef.onDestroy(() => {
        this.document.removeEventListener('visibilitychange', onVisible);
        void this.wakeLock?.release();
        clearInterval(this.interval);
        void this.audio?.close();
      });
    });
  }

  protected go(i: number): void {
    this.index.set(Math.min(Math.max(i, 0), this.count() - 1));
  }

  protected toggleTimer(): void {
    const step = this.index();
    const minutes = this.step().timerMinutes;
    if (!minutes) return;
    this.unlockAudio();
    const now = Date.now();
    this.now.set(now);
    if (this.timers()[step]?.status === 'running') {
      this.timers.update((t) => T.pause(t, step, now));
    } else {
      this.timers.update((t) => T.start(t, step, minutes * 60_000, now));
    }
    this.syncTicking();
  }

  protected resetTimer(step = this.index()): void {
    this.timers.update((t) => T.reset(t, step));
    this.syncTicking();
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') this.go(this.index() + 1);
    else if (event.key === 'ArrowLeft') this.go(this.index() - 1);
  }

  private timerView(step: number, minutes: number) {
    // Records don't type a missing key as undefined; a never-started step has no entry.
    const state = this.timers()[step] as T.TimerState | undefined;
    const full = minutes * 60_000;
    const left = T.remainingMs(state, full, this.now());
    const status: T.TimerState['status'] | 'idle' = state?.status ?? 'idle';
    return {
      step,
      name: this.recipe().steps[step].title ?? `Step ${step + 1} timer`,
      status,
      clock: formatClock(left),
      label: { idle: 'Start', running: 'Pause', paused: 'Resume', done: 'Restart' }[status],
    };
  }

  private tick(): void {
    const now = Date.now();
    this.now.set(now);
    const { timers, finished } = T.settle(this.timers(), now);
    if (finished.length) {
      this.timers.set(timers);
      this.alert();
    }
    this.syncTicking();
  }

  /** Ticks only while a timer is running, so an idle cook mode does no work. */
  private syncTicking(): void {
    const running = T.anyRunning(this.timers());
    if (running && !this.interval) {
      this.interval = setInterval(() => this.tick(), 250);
    } else if (!running && this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  /** iOS only plays Web Audio started from a tap, so create it on the Start tap. */
  private unlockAudio(): void {
    if (this.audio || typeof AudioContext === 'undefined') return;
    this.audio = new AudioContext();
  }

  private alert(): void {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
    const ctx = this.audio;
    if (!ctx) return;
    void ctx.resume();
    for (let i = 0; i < 3; i++) {
      const at = ctx.currentTime + i * 0.45;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.32);
    }
  }

  private async requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator) || this.document.visibilityState !== 'visible') return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.screenStaysOn.set(true);
      this.wakeLock.addEventListener('release', () => this.screenStaysOn.set(false));
    } catch {
      // Denied (low battery, or not allowed here). Cook mode works without it.
      this.screenStaysOn.set(false);
    }
  }
}
