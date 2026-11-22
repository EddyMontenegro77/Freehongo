import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Quizes } from './quizes';
import { ListsDisplay } from '../../../../shared/components/character-lists/lists-display/lists-display';
import { QuizConfigWindow } from '../../components/quiz-config-window/quiz-config-window';
import { shortenUuid } from '../../../../shared/utils/urls.utils';

describe('Quizes', () => {
  let component: Quizes;
  let fixture: ComponentFixture<Quizes>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Quizes],
      providers: [{ provide: Router, useValue: routerMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Quizes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the lists section', () => {
    expect(fixture.nativeElement.querySelector('app-lists-display')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-quiz-config-window')).toBeTruthy();
  });

  it('opens the configuration window for the selected list', () => {
    const configWindow = { open: vi.fn() };
    (component as any).configWindow = configWindow;

    component.openQuizConfig('list-1');

    expect(configWindow.open).toHaveBeenCalled();
  });

  it('opens configuration when the real lists display emits a selected list', () => {
    const configWindow = fixture.debugElement.query(By.directive(QuizConfigWindow))
      .componentInstance as QuizConfigWindow;
    const open = vi.spyOn(configWindow, 'open');
    const listsDisplay = fixture.debugElement.query(By.directive(ListsDisplay))
      .componentInstance as ListsDisplay;

    listsDisplay.quizSelected.emit('list-1');

    expect(open).toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('navigates with the selected quiz settings as query params', async () => {
    (component as any).selectedListId = 'list-1';
    await component.takeQuiz({
      mode: 'evaluation',
      characterQuizType: 'readingToCharacter',
      answerType: 'open',
      order: 'list',
    });

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/quizzes', 'evaluation', shortenUuid('list-1')],
      {
        queryParams: {
          type: 'readingToCharacter',
          answerType: 'open',
          order: 'list',
        },
      },
    );
  });
});
