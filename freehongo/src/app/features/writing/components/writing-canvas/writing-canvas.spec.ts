import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WritingCanvas } from './writing-canvas';
import { Stroke } from '../../../../shared/models/writing/stroke.model';

describe('WritingCanvas', () => {
  let component: WritingCanvas;
  let fixture: ComponentFixture<WritingCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritingCanvas],
    })
    .compileComponents();

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      canvas: { width: 400, height: 400 },
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({} as never),
      putImageData: vi.fn(),
      fillStyle: 'black',
      lineWidth: 4,
      lineCap: 'round',
      lineJoin: 'round',
    } as never);

    fixture = TestBed.createComponent(WritingCanvas);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('width', 400);
    fixture.componentRef.setInput('height', 400);
    fixture.componentRef.setInput('unicode', '3043');
    fixture.componentRef.setInput('type', 'kana');
    fixture.componentRef.setInput('expectedStrokes', [] as Stroke[]);
    fixture.componentRef.setInput('expectedUrl', '');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
