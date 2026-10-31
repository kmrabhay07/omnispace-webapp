import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MotionService } from './motion.service';

describe('Motion preferences', () => {
  let changed: (event: { matches: boolean }) => void;
  let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    localStorage.removeItem('omnispace.motion');
    media = { matches: false, addEventListener: vi.fn((_type, listener) => changed = listener), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', vi.fn(() => media));
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    localStorage.removeItem('omnispace.motion');
    delete document.documentElement.dataset['motion'];
  });
  it('persists pause across sessions and applies it to CSS effects', () => {
    const motion = TestBed.inject(MotionService);
    expect(motion.enabled()).toBe(true);
    motion.toggle(); TestBed.tick();
    expect(motion.enabled()).toBe(false);
    expect(localStorage.getItem('omnispace.motion')).toBe('paused');
    expect(document.documentElement.dataset['motion']).toBe('reduced');
    TestBed.resetTestingModule();
    expect(TestBed.inject(MotionService).enabled()).toBe(false);
  });
  it('never overrides the operating system reduced-motion preference', () => {
    media.matches = true;
    const motion = TestBed.inject(MotionService);
    motion.toggle();
    expect(motion.systemReduced()).toBe(true);
    expect(motion.enabled()).toBe(false);
  });
  it('responds to preference changes and releases its media listener', () => {
    const motion = TestBed.inject(MotionService);
    changed({ matches: true }); expect(motion.enabled()).toBe(false);
    changed({ matches: false }); expect(motion.enabled()).toBe(true);
    TestBed.resetTestingModule();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', changed);
  });
});
