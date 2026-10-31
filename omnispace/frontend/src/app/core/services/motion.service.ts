import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';

/** One preference for every decorative effect, including native route transitions. */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly media = this.window?.matchMedia?.('(prefers-reduced-motion: reduce)');
  readonly systemReduced = signal(this.media?.matches ?? false);
  private readonly paused = signal(this.readPreference());
  readonly enabled = computed(() => !this.systemReduced() && !this.paused());

  constructor() {
    const changed = (event: MediaQueryListEvent) => this.systemReduced.set(event.matches);
    this.media?.addEventListener('change', changed);
    effect(() => this.document.documentElement.dataset['motion'] = this.enabled() ? 'full' : 'reduced');
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', changed));
  }

  toggle() {
    if (this.systemReduced()) return;
    this.paused.update(value => !value);
    try { this.window?.localStorage.setItem('omnispace.motion', this.paused() ? 'paused' : 'full'); } catch { /* Storage can be disabled. */ }
  }

  private readPreference() {
    try { return this.window?.localStorage.getItem('omnispace.motion') === 'paused'; } catch { return false; }
  }
}
