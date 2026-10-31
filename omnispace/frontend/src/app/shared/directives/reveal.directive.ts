import { afterNextRender, DestroyRef, Directive, effect, ElementRef, inject, input, numberAttribute } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective {
  readonly appReveal = input(0, { transform: (value: number | string) => numberAttribute(value, 0) });
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      if (!this.motion.enabled() || typeof IntersectionObserver === 'undefined') return;
      this.element.style.setProperty('--reveal-delay', `${Math.min(this.appReveal(), 240)}ms`);
      this.element.classList.add('reveal-pending');
      this.observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) this.reveal();
      }, { threshold: 0.08 });
      this.observer.observe(this.element);
    });
    effect(() => { if (!this.motion.enabled()) this.reveal(); });
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  private reveal() {
    this.element.classList.remove('reveal-pending');
    this.observer?.disconnect();
  }
}
