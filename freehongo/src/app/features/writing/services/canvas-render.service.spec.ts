import { TestBed } from '@angular/core/testing';

import { CanvasRenderService } from './canvas-render.service';

describe('CanvasRenderService', () => {
  let service: CanvasRenderService;
  let ctx: CanvasRenderingContext2D;

  ctx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasRenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set canvas context and fill style', () => {
    service.setCanvasContext(ctx);

    expect(service.canvasContext).toBe(ctx);
    expect(ctx.fillStyle).toBe('black');
  });

  it('should render a line from lastPoint to currentPoint', () => {
    service.setCanvasContext(ctx);

    service.renderPoint({ x: 10, y: 20 }, { x: 30, y: 40 });

    expect(ctx.beginPath).toHaveBeenCalledOnce();
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(30, 40);
    expect(ctx.stroke).toHaveBeenCalledOnce();
  });
});
