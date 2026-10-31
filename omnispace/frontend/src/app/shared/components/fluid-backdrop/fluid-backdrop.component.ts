import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, NgZone, viewChild } from '@angular/core';
import { MotionService } from '../../../core/services/motion.service';

@Component({
  selector: 'app-fluid-backdrop', standalone: true,
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styles: [':host{position:absolute;inset:0;display:block;pointer-events:none;overflow:hidden;contain:strict}canvas{display:block;width:100%;height:100%}']
})
export class FluidBackdropComponent {
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private readonly zone = inject(NgZone);
  private context?: CanvasRenderingContext2D;
  private frame = 0;
  private width = 1;
  private height = 1;
  private visible = true;
  private time = 0;
  private last = 0;
  private pointer = { x: 0.68, y: 0.5 };
  private target = { x: 0.68, y: 0.5 };

  constructor() {
    let resize: ResizeObserver | undefined;
    let visibility: IntersectionObserver | undefined;
    let parent: HTMLElement | null = null;
    const onVisibility = () => this.sync();
    const onMove = (event: PointerEvent) => {
      if (!this.motion.enabled() || event.pointerType !== 'mouse') return;
      const box = this.host.getBoundingClientRect();
      this.target = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
    };
    const onLeave = () => this.target = { x: 0.68, y: 0.5 };
    afterNextRender(() => this.zone.runOutsideAngular(() => {
      const canvas = this.canvas()?.nativeElement;
      if (!canvas) return;
      this.context = canvas.getContext('2d', { alpha: true }) ?? undefined;
      if (!this.context) return;
      const size = () => {
        const box = this.host.getBoundingClientRect();
        this.width = Math.max(1, box.width); this.height = Math.max(1, box.height);
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(this.width * ratio); canvas.height = Math.round(this.height * ratio);
        this.context!.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.draw();
      };
      size();
      if (typeof ResizeObserver !== 'undefined') { resize = new ResizeObserver(size); resize.observe(this.host); }
      if (typeof IntersectionObserver !== 'undefined') {
        visibility = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.sync(); });
        visibility.observe(this.host);
      }
      parent = this.host.parentElement;
      parent?.addEventListener('pointermove', onMove, { passive: true });
      parent?.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
      this.sync();
    }));
    effect(() => { this.motion.enabled(); this.zone.runOutsideAngular(() => this.sync()); });
    inject(DestroyRef).onDestroy(() => {
      this.stop(); resize?.disconnect(); visibility?.disconnect();
      parent?.removeEventListener('pointermove', onMove); parent?.removeEventListener('pointerleave', onLeave);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
      this.context = undefined;
    });
  }

  private stop() { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; this.last = 0; }
  private sync() {
    if (!this.context) return;
    this.stop();
    if (this.motion.enabled() && this.visible && !document.hidden) this.frame = requestAnimationFrame(this.animate);
    else this.draw();
  }
  private animate = (now: number) => {
    this.frame = requestAnimationFrame(this.animate);
    if (this.last && now - this.last < 1000 / 30) return;
    this.time += this.last ? Math.min(now - this.last, 64) / 1000 : 0;
    this.last = now;
    this.pointer.x += (this.target.x - this.pointer.x) * 0.045;
    this.pointer.y += (this.target.y - this.pointer.y) * 0.045;
    this.draw();
  };

  private draw() {
    const ctx = this.context;
    if (!ctx) return;
    const w = this.width, h = this.height, t = this.time * 0.16;
    ctx.clearRect(0, 0, w, h);
    // Soft light underlays and layered contour ribbons, bounded to the hero.
    const glow = ctx.createRadialGradient(w * this.pointer.x, h * this.pointer.y, 0, w * 0.75, h * 0.6, w * 0.65);
    glow.addColorStop(0, 'rgba(230,151,109,0.19)'); glow.addColorStop(1, 'rgba(230,151,109,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    for (let ribbon = 0; ribbon < 32; ribbon++) {
      const p = ribbon / 31;
      ctx.beginPath();
      for (let step = 0; step <= 70; step++) {
        const x = step / 70 * w;
        const phase = step / 70 * 5.4 + p * 1.8;
        const pointerBend = Math.exp(-Math.pow(step / 70 - this.pointer.x, 2) * 12) * (this.pointer.y - 0.5) * h * 0.3;
        const y = h * (0.46 + p * 0.42) + Math.sin(phase + t) * h * 0.16 + Math.cos(phase * 0.65 - t) * h * 0.12 + pointerBend;
        if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${218 + Math.round(p * 32)},${133 + Math.round(p * 45)},${102 + Math.round(p * 45)},${0.05 + Math.sin(p * Math.PI) * 0.15})`;
      ctx.lineWidth = p > 0.5 ? 1 : 0.7; ctx.stroke();
    }
  }
}
