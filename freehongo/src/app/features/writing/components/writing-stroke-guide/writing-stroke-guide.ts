import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  input,
} from '@angular/core';
import { gsap } from 'gsap';
import { Stroke } from '../../../../shared/models/writing/stroke.model';
import { Point } from '../../../../shared/models/writing/point.interface';

interface GuideStroke {
  d: string;
  start: Point;
  label: number;
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Animation speed (measured in canvas pixels, whatever the stroke coordinate space is)
const PIXELS_PER_SECOND = 650;
const MIN_STROKE_DURATION = 0.3;
const DOT_DURATION = 0.12;
const SETTLE_DURATION = 0.25;
const STROKE_GAP = 0.04;
const START_DELAY = 0.05;

// Fraction of empty space kept around the character inside the canvas
const VIEW_PADDING = 0.12;

// On-screen sizes in canvas pixels
const DEFAULT_LINE_WIDTH_PX = 10;
const MARKER_RADIUS_PX = 10;
const MARKER_FONT_PX = 12;

/**
 * Draws the expected strokes as an inline SVG that fills the canvas and animates
 * them one by one, each from its first point to its last, so the user sees
 * order and direction.
 */
@Component({
  selector: 'app-writing-stroke-guide',
  standalone: true,
  templateUrl: './writing-stroke-guide.html',
  styleUrl: './writing-stroke-guide.scss',
})
export class WritingStrokeGuide implements AfterViewInit {
  readonly strokes = input.required<Stroke[]>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  readonly autoplay = input(true);
  /** Line thickness in canvas pixels. */
  readonly lineWidth = input(DEFAULT_LINE_WIDTH_PX);

  @ViewChild('svg', { static: true }) private svg!: ElementRef<SVGSVGElement>;

  private timeline?: gsap.core.Timeline;

  private readonly strokePoints = computed<(readonly Point[])[]>(() =>
    this.strokes().map((stroke) => stroke.getPoints()),
  );

  readonly guideStrokes = computed<GuideStroke[]>(() =>
    this.strokePoints().flatMap((points, index) =>
      points.length < 2 ? [] : [{ d: this.toPath(points), start: points[0], label: index + 1 }],
    ),
  );

  /** Region of the stroke space shown in the SVG: fits the character to the canvas. */
  private readonly view = computed<ViewBox>(() => this.computeView());

  readonly viewBox = computed(() => {
    const { x, y, w, h } = this.view();
    return `${x} ${y} ${w} ${h}`;
  });

  /** Stroke-space units per canvas pixel, to keep strokes and markers a constant on-screen size. */
  private readonly unit = computed(() => this.view().w / this.width());

  readonly strokeWidth = computed(() => this.lineWidth() * this.unit());
  readonly markerRadius = computed(() => MARKER_RADIUS_PX * this.unit());
  readonly markerFont = computed(() => MARKER_FONT_PX * this.unit());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timeline?.kill());
  }

  ngAfterViewInit(): void {
    if (this.autoplay()) {
      this.play();
    }
  }

  /** Restarts the animation from the first stroke. */
  play = (): void => {
    this.timeline?.kill();

    const root = this.svg.nativeElement;
    const paths = root.querySelectorAll<SVGPathElement>('.guide-stroke');
    const dots = root.querySelectorAll<SVGGElement>('.guide-start');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(paths, { opacity: 0.35, strokeDasharray: 'none', strokeDashoffset: 0 });
      gsap.set(dots, { opacity: 0.7 });
      return;
    }

    gsap.set(paths, { opacity: 0 });
    gsap.set(dots, { opacity: 0 });

    const timeline = gsap.timeline();
    let cursor = START_DELAY;

    // Every tween is placed at an absolute time, so fading a finished stroke
    // overlaps with the next one instead of making it wait.
    paths.forEach((path, index) => {
      const length = path.getTotalLength();
      const duration = Math.max(MIN_STROKE_DURATION, length / this.unit() / PIXELS_PER_SECOND);
      const drawAt = cursor + DOT_DURATION;
      const doneAt = drawAt + duration;

      timeline
        .set(path, { opacity: 1, strokeDasharray: length, strokeDashoffset: length }, cursor)
        .fromTo(
          dots[index],
          { opacity: 0, scale: 0, transformOrigin: '50% 50%' },
          { opacity: 1, scale: 1, duration: DOT_DURATION, ease: 'back.out(2)' },
          cursor,
        )
        .to(path, { strokeDashoffset: 0, duration, ease: 'power1.inOut' }, drawAt)
        .to(path, { opacity: 0.35, duration: SETTLE_DURATION }, doneAt)
        .to(dots[index], { opacity: 0.7, duration: SETTLE_DURATION }, doneAt);

      cursor = doneAt + STROKE_GAP;
    });

    this.timeline = timeline;
  };

  private computeView(): ViewBox {
    const canvasView: ViewBox = { x: 0, y: 0, w: this.width(), h: this.height() };
    const points = this.strokePoints().flat();

    if (points.length === 0) {
      return canvasView;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    let w = maxX - minX;
    let h = maxY - minY;

    if (w === 0 && h === 0) {
      return canvasView;
    }

    // Same aspect ratio as the canvas, so the SVG fills it without letterboxing.
    const ratio = this.width() / this.height();

    if (w < h * ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }

    w *= 1 + 2 * VIEW_PADDING;
    h *= 1 + 2 * VIEW_PADDING;

    return { x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2, w, h };
  }

  private toPath(points: readonly Point[]): string {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  }
}
