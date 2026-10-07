import { ComponentFixture, TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { WritingStrokeGuide } from './writing-stroke-guide';
import { Stroke } from '../../../../shared/models/writing/stroke.model';

const makeStroke = (...coords: [number, number][]): Stroke => {
  const stroke = new Stroke();
  coords.forEach(([x, y]) => stroke.addPoint({ x, y }));
  return stroke;
};

// Stroke 2 has a single point, so it cannot be drawn and has to be skipped.
const STROKES = [
  makeStroke([0, 50], [100, 50]),
  makeStroke([30, 30]),
  makeStroke([50, 0], [50, 100]),
];

function createFakeTimeline() {
  const timeline = { set: vi.fn(), fromTo: vi.fn(), to: vi.fn(), kill: vi.fn() };
  timeline.set.mockReturnValue(timeline);
  timeline.fromTo.mockReturnValue(timeline);
  timeline.to.mockReturnValue(timeline);
  return timeline;
}

describe('WritingStrokeGuide', () => {
  let fixture: ComponentFixture<WritingStrokeGuide>;
  let component: WritingStrokeGuide;
  let timeline: ReturnType<typeof createFakeTimeline>;
  let gsapSet: ReturnType<typeof vi.spyOn>;
  let pathLength: number;
  let reducedMotion: boolean;

  function setup(
    options: {
      strokes?: Stroke[];
      width?: number;
      height?: number;
      autoplay?: boolean;
      lineWidth?: number;
    } = {},
  ): void {
    fixture = TestBed.createComponent(WritingStrokeGuide);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('strokes', options.strokes ?? STROKES);
    fixture.componentRef.setInput('width', options.width ?? 400);
    fixture.componentRef.setInput('height', options.height ?? 400);

    if (options.autoplay !== undefined) {
      fixture.componentRef.setInput('autoplay', options.autoplay);
    }

    if (options.lineWidth !== undefined) {
      fixture.componentRef.setInput('lineWidth', options.lineWidth);
    }

    fixture.detectChanges();
  }

  const svg = (): SVGSVGElement => fixture.nativeElement.querySelector('svg');
  const paths = (): SVGPathElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.guide-stroke'));

  function viewBox(): { x: number; y: number; w: number; h: number } {
    const [x, y, w, h] = svg().getAttribute('viewBox')!.split(' ').map(Number);
    return { x, y, w, h };
  }

  beforeEach(async () => {
    pathLength = 100;
    reducedMotion = false;
    timeline = createFakeTimeline();

    // jsdom does not implement SVG geometry nor matchMedia.
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
      configurable: true,
      writable: true,
      value: () => pathLength,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn(() => ({ matches: reducedMotion })),
    });

    vi.spyOn(gsap, 'timeline').mockImplementation(() => timeline as never);
    gsapSet = vi.spyOn(gsap, 'set').mockImplementation(() => undefined as never);

    await TestBed.configureTestingModule({ imports: [WritingStrokeGuide] }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (SVGElement.prototype as { getTotalLength?: unknown }).getTotalLength;
  });

  describe('rendering', () => {
    it('draws a path and a numbered marker for each stroke with at least two points', () => {
      setup();

      const labels = Array.from(fixture.nativeElement.querySelectorAll('.guide-start text')).map(
        (text) => (text as Element).textContent?.trim(),
      );

      expect(paths()).toHaveLength(2);
      // The skipped stroke keeps its number, so the labels are 1 and 3.
      expect(labels).toEqual(['1', '3']);
    });

    it('builds each path from the stroke points', () => {
      setup();

      expect(paths()[0].getAttribute('d')).toBe('M0 50 L100 50');
      expect(paths()[1].getAttribute('d')).toBe('M50 0 L50 100');
    });

    it('places the start marker on the first point of the stroke', () => {
      setup();

      const circle = fixture.nativeElement.querySelector('.guide-start circle');

      expect(circle.getAttribute('cx')).toBe('0');
      expect(circle.getAttribute('cy')).toBe('50');
    });
  });

  describe('view box', () => {
    it('fits the character to the canvas with a margin', () => {
      setup();

      const { x, y, w, h } = viewBox();

      expect(w).toBeCloseTo(124, 5);
      expect(h).toBeCloseTo(124, 5);
      expect(x).toBeCloseTo(-12, 5);
      expect(y).toBeCloseTo(-12, 5);
    });

    it('keeps the aspect ratio of a non-square canvas', () => {
      setup({ width: 400, height: 200 });

      const { w, h } = viewBox();

      expect(w / h).toBeCloseTo(2, 5);
    });

    it('falls back to the canvas size when there are no strokes', () => {
      setup({ strokes: [] });

      expect(svg().getAttribute('viewBox')).toBe('0 0 400 400');
    });

    it('falls back to the canvas size when all points are the same', () => {
      setup({ strokes: [makeStroke([5, 5])] });

      expect(svg().getAttribute('viewBox')).toBe('0 0 400 400');
    });
  });

  describe('line thickness', () => {
    it('keeps a constant on-screen width whatever the stroke coordinate space is', () => {
      setup({ lineWidth: 8 });

      const unit = viewBox().w / 400;

      expect(Number(paths()[0].getAttribute('stroke-width'))).toBeCloseTo(8 * unit, 5);
    });

    it('draws thicker lines when lineWidth grows', () => {
      setup({ lineWidth: 6 });
      const thin = Number(paths()[0].getAttribute('stroke-width'));

      fixture.componentRef.setInput('lineWidth', 14);
      fixture.detectChanges();

      expect(Number(paths()[0].getAttribute('stroke-width'))).toBeGreaterThan(thin);
    });
  });

  describe('animation', () => {
    it('plays on init by default', () => {
      setup();

      expect(gsap.timeline).toHaveBeenCalledTimes(1);
    });

    it('does not play on init when autoplay is off, only when asked', () => {
      setup({ autoplay: false });
      expect(gsap.timeline).not.toHaveBeenCalled();

      component.play();

      expect(gsap.timeline).toHaveBeenCalledTimes(1);
    });

    it('hides the dash of every stroke before drawing it', () => {
      pathLength = 100;
      setup();

      expect(timeline.set).toHaveBeenCalledTimes(2);
      expect(timeline.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ strokeDasharray: 100, strokeDashoffset: 100 }),
        expect.any(Number),
      );
    });

    it('draws each stroke from start to end', () => {
      setup();

      const draws = timeline.to.mock.calls.filter(([, vars]) => vars.strokeDashoffset === 0);

      expect(draws).toHaveLength(2);
    });

    it('draws the strokes one after another, never at the same time', () => {
      setup();

      const [first, second] = timeline.to.mock.calls
        .filter(([, vars]) => vars.strokeDashoffset === 0)
        .map(([, vars, position]) => ({ start: position as number, duration: vars.duration }));

      expect(second.start).toBeGreaterThanOrEqual(first.start + first.duration);
    });

    it('never makes a stroke faster than the minimum duration', () => {
      pathLength = 1;
      setup();

      const durations = timeline.to.mock.calls
        .filter(([, vars]) => vars.strokeDashoffset === 0)
        .map(([, vars]) => vars.duration);

      expect(durations).toEqual([0.3, 0.3]);
    });

    it('takes longer to draw a longer stroke', () => {
      pathLength = 100;
      setup();
      const short = timeline.to.mock.calls.find(([, vars]) => vars.strokeDashoffset === 0)![1]
        .duration;

      timeline.to.mockClear();
      pathLength = 5000;
      component.play();
      const long = timeline.to.mock.calls.find(([, vars]) => vars.strokeDashoffset === 0)![1]
        .duration;

      expect(long).toBeGreaterThan(short);
    });

    it('stops the previous animation when it is replayed', () => {
      setup();

      component.play();

      expect(timeline.kill).toHaveBeenCalledTimes(1);
    });

    it('stops the animation when the component is destroyed', () => {
      setup();

      fixture.destroy();

      expect(timeline.kill).toHaveBeenCalled();
    });
  });

  describe('reduced motion', () => {
    it('shows the guide without animating it', () => {
      reducedMotion = true;
      setup();

      expect(gsap.timeline).not.toHaveBeenCalled();
      expect(gsapSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ strokeDasharray: 'none', strokeDashoffset: 0 }),
      );
    });
  });
});
