import { TestBed } from '@angular/core/testing';

import { CanvasRenderService } from './canvas-render.service';
import { Stroke } from '../../../shared/models/writing/stroke.model';

describe('CanvasRenderService', () => {
  let service: CanvasRenderService;
  let ctx: CanvasRenderingContext2D;
  let imageIdCounter: number;

  function createStroke(points: { x: number; y: number }[]): Stroke {
    const stroke = new Stroke();
    stroke.setPoints(points);
    return stroke;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasRenderService);

    imageIdCounter = 0;
    ctx = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ id: ++imageIdCounter }) as unknown as ImageData),
      putImageData: vi.fn(),
      fillStyle: '',
      canvas: { width: 256, height: 256 } as HTMLCanvasElement,
    } as unknown as CanvasRenderingContext2D;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set canvas context and fill style', () => {
    service.setCanvasContext(ctx);

    expect(service.canvasContext).toBe(ctx);
    expect(ctx.fillStyle).toBe('black');
    expect(service.historyImages).toHaveLength(1);
    expect(service.historyIndex).toBe(0);
  });

  it('should render a line from lastPoint to currentPoint', () => {
    service.setCanvasContext(ctx);

    service.renderPoint({ x: 10, y: 20 }, { x: 30, y: 40 });

    expect(ctx.beginPath).toHaveBeenCalledOnce();
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(30, 40);
    expect(ctx.stroke).toHaveBeenCalledOnce();
  });

  it('should render a stroke path', () => {
    service.setCanvasContext(ctx);
    const stroke = createStroke([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 5 },
    ]);

    service.renderStroke(stroke);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.lineTo).toHaveBeenCalledWith(20, 5);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should save snapshot and cap by max snapshots', () => {
    service.setCanvasContext(ctx);

    for (let i = 0; i < 5; i++) {
      service.saveCanvasSnapshot(3);
    }

    expect(service.historyImages).toHaveLength(3);
    expect(service.historyIndex).toBe(2);
  });

  it('should undo and redo canvas snapshot', () => {
    service.setCanvasContext(ctx);
    service.saveCanvasSnapshot();
    service.saveCanvasSnapshot();

    const undone = service.undoCanvasSnapshot();
    expect(undone).toBe(true);
    expect(ctx.putImageData).toHaveBeenCalled();

    const redone = service.redoCanvasSnapshot();
    expect(redone).toBe(true);
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });

  it('should return false when undo is not possible', () => {
    service.setCanvasContext(ctx);

    expect(service.undoCanvasSnapshot()).toBe(false);
  });

  it('should return false when redo is not possible', () => {
    service.setCanvasContext(ctx);

    expect(service.redoCanvasSnapshot()).toBe(false);
  });

  it('should clear canvas and reset history with baseline snapshot', () => {
    service.setCanvasContext(ctx);
    service.saveCanvasSnapshot();

    service.clearCanvas();

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 256, 256);
    expect(service.historyImages).toHaveLength(1);
    expect(service.historyIndex).toBe(0);
  });

  it('should trim future snapshots when saving after undo', () => {
    service.setCanvasContext(ctx); // [1], index 0
    service.saveCanvasSnapshot(); // [1,2], index 1
    service.saveCanvasSnapshot(); // [1,2,3], index 2
    service.undoCanvasSnapshot(); // index 1

    service.saveCanvasSnapshot(); // trims future (3) and adds new

    expect(service.historyImages).toHaveLength(3);
    expect(service.historyIndex).toBe(2);
  });

  it('should render all strokes and save final snapshot', () => {
    service.setCanvasContext(ctx);
    const strokes = [
      createStroke([
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ]),
      createStroke([
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ]),
    ];

    service.renderAllStrokes(strokes);

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
    expect(service.historyImages.length).toBeGreaterThan(0);
  });
});
