import { Component, forwardRef, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { WritingCanvas } from './writing-canvas';
import { WritingValidation } from '../writing-validation/writing-validation';
import { WritingStrokeGuide } from '../writing-stroke-guide/writing-stroke-guide';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { StrokeService } from '../../services/stroke.service';
import { CanvasRenderService } from '../../services/canvas-render.service';
import { StrokeValidationService } from '../../services/stroke-validation.service';
import { ThemeService } from '../../../../shared/services/theme/theme.service';
import { sequenceErrorLabel } from '../../mappers/sequence-error-label.mapper';
import { Stroke } from '../../../../shared/models/writing/stroke.model';
import {
  DEFAULT_WRITING_UI,
  WritingUiOptions,
  WritingValidationEvent,
} from '../../../../shared/models/quizes/quizes.interface';

@Component({ selector: 'app-writing-validation', template: '' })
class StubWritingValidation {
  readonly expectedUrl = input<string>('');
  readonly hasValidationResults = input<boolean>(false);
  readonly isValidSequence = input<boolean>(false);
  readonly sequenceError = input<string>('');
  readonly strokeResults = input<unknown[]>([]);
}

/** The provider makes @ViewChild(WritingStrokeGuide) resolve to this stub. */
@Component({
  selector: 'app-writing-stroke-guide',
  template: '',
  providers: [{ provide: WritingStrokeGuide, useExisting: forwardRef(() => StubStrokeGuide) }],
})
class StubStrokeGuide {
  readonly strokes = input<Stroke[]>([]);
  readonly width = input<number>(0);
  readonly height = input<number>(0);

  play = vi.fn();
}

describe('WritingCanvas', () => {
  let fixture: ComponentFixture<WritingCanvas>;
  let component: WritingCanvas;

  let strokeService: {
    getStrokes: ReturnType<typeof vi.fn>;
    addStroke: ReturnType<typeof vi.fn>;
    cleanStrokes: ReturnType<typeof vi.fn>;
    undo: ReturnType<typeof vi.fn>;
    redo: ReturnType<typeof vi.fn>;
  };
  let canvasRender: {
    setCanvasContext: ReturnType<typeof vi.fn>;
    renderPoint: ReturnType<typeof vi.fn>;
    renderAllStrokes: ReturnType<typeof vi.fn>;
    updateCanvasTheme: ReturnType<typeof vi.fn>;
    saveCanvasSnapshot: ReturnType<typeof vi.fn>;
    clearCanvas: ReturnType<typeof vi.fn>;
    undoCanvasSnapshot: ReturnType<typeof vi.fn>;
    redoCanvasSnapshot: ReturnType<typeof vi.fn>;
  };
  let strokeValidation: { validateSequence: ReturnType<typeof vi.fn> };

  const expectedStrokes = [new Stroke()];

  function setup(ui: WritingUiOptions = DEFAULT_WRITING_UI): void {
    fixture = TestBed.createComponent(WritingCanvas);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('width', 400);
    fixture.componentRef.setInput('height', 400);
    fixture.componentRef.setInput('unicode', '3042');
    fixture.componentRef.setInput('type', 'kana');
    fixture.componentRef.setInput('expectedStrokes', expectedStrokes);
    fixture.componentRef.setInput('expectedUrl', '');
    fixture.componentRef.setInput('ui', ui);
    fixture.detectChanges();
  }

  const withUi = (overrides: Partial<WritingUiOptions>): WritingUiOptions => ({
    ...DEFAULT_WRITING_UI,
    ...overrides,
  });

  const buttonTitles = (): string[] =>
    fixture.debugElement
      .queryAll(By.directive(ActionBtn))
      .map((button) => button.componentInstance.title());

  const keydown = (key: string, init: KeyboardEventInit = {}): KeyboardEvent =>
    new KeyboardEvent('keydown', { key, ...init });

  beforeEach(async () => {
    strokeService = {
      getStrokes: vi.fn().mockReturnValue([]),
      addStroke: vi.fn(),
      cleanStrokes: vi.fn(),
      undo: vi.fn().mockReturnValue(true),
      redo: vi.fn().mockReturnValue(true),
    };
    canvasRender = {
      setCanvasContext: vi.fn(),
      renderPoint: vi.fn(),
      renderAllStrokes: vi.fn(),
      updateCanvasTheme: vi.fn(),
      saveCanvasSnapshot: vi.fn(),
      clearCanvas: vi.fn(),
      undoCanvasSnapshot: vi.fn().mockReturnValue(true),
      redoCanvasSnapshot: vi.fn().mockReturnValue(true),
    };
    strokeValidation = {
      validateSequence: vi.fn().mockReturnValue({
        isValidSequence: true,
        sequenceErrorType: 'none',
        strokeResults: [],
      }),
    };

    // jsdom has no canvas implementation.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(CanvasRenderService, 'getCanvasCoordinates').mockReturnValue({ x: 1, y: 1 });

    await TestBed.configureTestingModule({
      imports: [WritingCanvas],
      providers: [
        { provide: StrokeService, useValue: strokeService },
        { provide: CanvasRenderService, useValue: canvasRender },
        { provide: StrokeValidationService, useValue: strokeValidation },
      ],
    })
      .overrideComponent(WritingCanvas, {
        remove: { imports: [WritingValidation, WritingStrokeGuide] },
        add: { imports: [StubWritingValidation, StubStrokeGuide] },
      })
      .compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives the 2D context to the render service on init', () => {
    setup();

    expect(canvasRender.setCanvasContext).toHaveBeenCalledTimes(1);
  });

  it('redraws the canvas when the theme changes', () => {
    setup();
    canvasRender.updateCanvasTheme.mockClear();

    TestBed.inject(ThemeService).setTheme('dark');
    fixture.detectChanges();

    expect(canvasRender.updateCanvasTheme).toHaveBeenCalledWith([]);
  });

  describe('drawing', () => {
    beforeEach(() => setup());

    it('stores the stroke and snapshots the canvas when the pointer is released', () => {
      vi.mocked(CanvasRenderService.getCanvasCoordinates)
        .mockReturnValueOnce({ x: 1, y: 1 })
        .mockReturnValueOnce({ x: 2, y: 2 })
        .mockReturnValueOnce({ x: 3, y: 3 });

      component.onPointerDown({} as PointerEvent);
      component.onPointerMove({} as PointerEvent);
      component.onPointerUp({} as PointerEvent);

      expect(canvasRender.renderPoint).toHaveBeenNthCalledWith(1, { x: 1, y: 1 }, { x: 2, y: 2 });
      expect(canvasRender.renderPoint).toHaveBeenNthCalledWith(2, { x: 2, y: 2 }, { x: 3, y: 3 });
      expect(strokeService.addStroke).toHaveBeenCalledTimes(1);
      expect(strokeService.addStroke.mock.calls[0][0].getPoints()).toHaveLength(3);
      expect(canvasRender.saveCanvasSnapshot).toHaveBeenCalledTimes(1);
    });

    it('ignores movement while the pointer is not down', () => {
      component.onPointerMove({} as PointerEvent);

      expect(canvasRender.renderPoint).not.toHaveBeenCalled();
    });

    it('ignores a release without a previous press', () => {
      component.onPointerUp({} as PointerEvent);

      expect(strokeService.addStroke).not.toHaveBeenCalled();
      expect(canvasRender.saveCanvasSnapshot).not.toHaveBeenCalled();
    });

    it('ignores movement that stays on the same point', () => {
      component.onPointerDown({} as PointerEvent);

      component.onPointerMove({} as PointerEvent);

      expect(canvasRender.renderPoint).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    beforeEach(() => setup());

    it('validates the drawn strokes against the expected ones', () => {
      const drawn = [new Stroke()];
      strokeService.getStrokes.mockReturnValue(drawn);

      component.getSequenceValidationResults();

      expect(strokeValidation.validateSequence).toHaveBeenCalledWith(drawn, expectedStrokes);
    });

    it('emits the validation result with the character it belongs to', () => {
      const emitted: WritingValidationEvent[] = [];
      component.validationCompleted.subscribe((event) => emitted.push(event));
      strokeValidation.validateSequence.mockReturnValue({
        isValidSequence: false,
        sequenceErrorType: 'wrong-order',
        strokeResults: [],
      });

      component.getSequenceValidationResults();

      expect(component.hasValidationResults).toBe(true);
      expect(component.isValidSequence).toBe(false);
      expect(emitted).toEqual([
        {
          unicode: '3042',
          isValid: false,
          sequenceError: sequenceErrorLabel('wrong-order'),
          strokeResults: [],
        },
      ]);
    });

    it('passes the validation state to the validation panel', () => {
      component.getSequenceValidationResults();
      // Plain fields do not notify a zoneless view, so mark it by hand.
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      const panel: StubWritingValidation = fixture.debugElement.query(
        By.directive(StubWritingValidation),
      ).componentInstance;

      expect(panel.hasValidationResults()).toBe(true);
      expect(panel.isValidSequence()).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears strokes, canvas and validation state', () => {
      setup();
      component.hasValidationResults = true;
      component.isValidSequence = true;
      component.sequenceError = 'wrong-order';

      component.resetCanvas();

      expect(strokeService.cleanStrokes).toHaveBeenCalledTimes(1);
      expect(canvasRender.clearCanvas).toHaveBeenCalledTimes(1);
      expect(component.hasValidationResults).toBe(false);
      expect(component.isValidSequence).toBe(false);
      expect(component.sequenceError).toBe('none');
      expect(component.strokeResults).toEqual([]);
    });
  });

  describe('undo and redo', () => {
    beforeEach(() => setup());

    it('does nothing to the canvas when there is nothing to undo', () => {
      strokeService.undo.mockReturnValue(false);

      component.undoStroke();

      expect(canvasRender.undoCanvasSnapshot).not.toHaveBeenCalled();
      expect(canvasRender.renderAllStrokes).not.toHaveBeenCalled();
    });

    it('restores the previous snapshot when it is available', () => {
      component.undoStroke();

      expect(canvasRender.undoCanvasSnapshot).toHaveBeenCalledTimes(1);
      expect(canvasRender.renderAllStrokes).not.toHaveBeenCalled();
    });

    it('redraws from the stroke service when the snapshot history ran out on undo', () => {
      const strokes = [new Stroke()];
      strokeService.getStrokes.mockReturnValue(strokes);
      canvasRender.undoCanvasSnapshot.mockReturnValue(false);

      component.undoStroke();

      expect(canvasRender.renderAllStrokes).toHaveBeenCalledWith(strokes);
    });

    it('does nothing to the canvas when there is nothing to redo', () => {
      strokeService.redo.mockReturnValue(false);

      component.redoStroke();

      expect(canvasRender.redoCanvasSnapshot).not.toHaveBeenCalled();
      expect(canvasRender.renderAllStrokes).not.toHaveBeenCalled();
    });

    it('redraws from the stroke service when the snapshot history ran out on redo', () => {
      const strokes = [new Stroke()];
      strokeService.getStrokes.mockReturnValue(strokes);
      canvasRender.redoCanvasSnapshot.mockReturnValue(false);

      component.redoStroke();

      expect(canvasRender.renderAllStrokes).toHaveBeenCalledWith(strokes);
    });
  });

  describe('keyboard shortcuts', () => {
    let undo: ReturnType<typeof vi.spyOn>;
    let redo: ReturnType<typeof vi.spyOn>;
    let reset: ReturnType<typeof vi.spyOn>;
    let validate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      setup();
      undo = vi.spyOn(component, 'undoStroke').mockImplementation(() => undefined);
      redo = vi.spyOn(component, 'redoStroke').mockImplementation(() => undefined);
      reset = vi.spyOn(component, 'resetCanvas').mockImplementation(() => undefined);
      validate = vi
        .spyOn(component, 'getSequenceValidationResults')
        .mockImplementation(() => undefined);
    });

    it('undoes with Ctrl+Z and Cmd+Z', () => {
      component.handleKeyboard(keydown('z', { ctrlKey: true }));
      component.handleKeyboard(keydown('z', { metaKey: true }));

      expect(undo).toHaveBeenCalledTimes(2);
      expect(redo).not.toHaveBeenCalled();
    });

    it('redoes with Ctrl+Shift+Z and Ctrl+Y', () => {
      component.handleKeyboard(keydown('z', { ctrlKey: true, shiftKey: true }));
      component.handleKeyboard(keydown('y', { ctrlKey: true }));

      expect(redo).toHaveBeenCalledTimes(2);
      expect(undo).not.toHaveBeenCalled();
    });

    it('resets with Ctrl+R and prevents the browser reload', () => {
      const event = keydown('r', { ctrlKey: true, cancelable: true });

      component.handleKeyboard(event);

      expect(reset).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('validates with Ctrl+V', () => {
      component.handleKeyboard(keydown('v', { ctrlKey: true }));

      expect(validate).toHaveBeenCalledTimes(1);
    });

    it('ignores keys pressed without Ctrl or Cmd', () => {
      component.handleKeyboard(keydown('z'));
      component.handleKeyboard(keydown('r'));
      component.handleKeyboard(keydown('v'));

      expect(undo).not.toHaveBeenCalled();
      expect(reset).not.toHaveBeenCalled();
      expect(validate).not.toHaveBeenCalled();
    });
  });

  describe('toolbar', () => {
    it('shows the drawing tools and the validate button by default', () => {
      setup(withUi({ showValidateButton: true }));

      expect(buttonTitles()).toEqual(expect.arrayContaining(['Reset', 'Validate']));
    });

    it('hides the validate button when the UI options say so', () => {
      setup(withUi({ showValidateButton: false }));

      expect(buttonTitles()).not.toContain('Validate');
    });
  });

  describe('stroke guide', () => {
    const guideElement = (): HTMLElement | null =>
      fixture.nativeElement.querySelector('app-writing-stroke-guide');

    it('offers the guide but keeps it hidden until it is requested', () => {
      setup(withUi({ showExpectedPreview: true }));

      expect(buttonTitles()).toContain('Show guide');
      expect(buttonTitles()).not.toContain('Replay');
      expect(guideElement()).toBeNull();
    });

    it('shows the guide with replay and hide controls after toggling it', () => {
      setup(withUi({ showExpectedPreview: true }));

      component.togglePreview();
      fixture.detectChanges();

      expect(guideElement()).not.toBeNull();
      expect(buttonTitles()).toContain('Hide');
      expect(fixture.nativeElement.querySelector('app-icon-btn button')).toBeTruthy();
    });

    it('hides the guide again when toggled twice', () => {
      setup(withUi({ showExpectedPreview: true }));

      component.togglePreview();
      component.togglePreview();
      fixture.detectChanges();

      expect(guideElement()).toBeNull();
    });

    it('replays the animation of the visible guide', () => {
      setup(withUi({ showExpectedPreview: true }));
      component.togglePreview();
      fixture.detectChanges();
      const guide: StubStrokeGuide = fixture.debugElement.query(
        By.directive(StubStrokeGuide),
      ).componentInstance;

      component.replayGuide();

      expect(guide.play).toHaveBeenCalledTimes(1);
    });

    it('does not offer the guide when the preview is disabled (evaluation)', () => {
      setup(withUi({ showExpectedPreview: false }));
      component.togglePreview();
      fixture.detectChanges();

      expect(buttonTitles()).not.toContain('Show guide');
      expect(guideElement()).toBeNull();
    });
  });

  describe('validation panel', () => {
    it('is shown when validation results are enabled', () => {
      setup(withUi({ showValidationResults: true }));

      expect(fixture.nativeElement.querySelector('app-writing-validation')).not.toBeNull();
    });

    it('is hidden when validation results are disabled (evaluation)', () => {
      setup(withUi({ showValidationResults: false }));

      expect(fixture.nativeElement.querySelector('app-writing-validation')).toBeNull();
    });
  });
});
