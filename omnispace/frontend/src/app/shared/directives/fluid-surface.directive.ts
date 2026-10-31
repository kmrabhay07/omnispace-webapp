import { afterNextRender, DestroyRef, Directive, effect, ElementRef, inject, input, NgZone } from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

/** Pointer lighting and restrained depth. Never intercepts touch scrolling. */
@Directive({ selector: '[appFluidSurface]', standalone: true, host: { class: 'fluid-surface', '[class.fluid-tilt]': 'tilt()' } })
export class FluidSurfaceDirective {
  readonly tilt = input(false);
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private frame = 0;

  constructor() {
    const zone = inject(NgZone);
    const reset = () => {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.element.style.setProperty('--tilt-x', '0deg');
      this.element.style.setProperty('--tilt-y', '0deg');
      this.element.classList.remove('pointer-active');
    };
    const move = (event: PointerEvent) => {
      if (!this.motion.enabled() || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => {
        const bounds = this.element.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
        this.element.style.setProperty('--pointer-x', `${x * 100}%`);
        this.element.style.setProperty('--pointer-y', `${y * 100}%`);
        this.element.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
        this.element.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
        this.element.classList.add('pointer-active');
        this.frame = 0;
      });
    };
    afterNextRender(() => zone.runOutsideAngular(() => {
      this.element.addEventListener('pointermove', move, { passive: true });
      this.element.addEventListener('pointerleave', reset);
    }));
    effect(() => { if (!this.motion.enabled() && typeof cancelAnimationFrame !== 'undefined') reset(); });
    inject(DestroyRef).onDestroy(() => {
      if (typeof cancelAnimationFrame !== 'undefined') reset();
      this.element.removeEventListener('pointermove', move);
      this.element.removeEventListener('pointerleave', reset);
    });
  }
}
