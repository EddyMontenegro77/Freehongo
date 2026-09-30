import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { signal } from '@angular/core';
import { CharacterQuiz } from './character-quiz';
import { CharacterQuizFacade } from '../../services/character-quiz.facade.service';

describe('CharacterQuiz', () => {
  let component: CharacterQuiz;
  let fixture: ComponentFixture<CharacterQuiz>;
  let facadeMock: any;

  beforeEach(async () => {
    facadeMock = {
      isLoading: signal(false),
      error: signal<string | null>(null),
      emptyList: signal(false),
      questions: signal([]),
      currentIndex: signal(0),
      score: signal(0),
      hasAnswered: signal(false),
      lastAnswerCorrect: signal<boolean | null>(null),
      isFinished: signal(false),
      answers: signal([]),
      currentQuestion: vi.fn(() => facadeMock.questions()[facadeMock.currentIndex()]),
      load: vi.fn().mockResolvedValue(undefined),
      submitAnswer: vi.fn(),
      nextQuestion: vi.fn(),
      dismissEmptyList: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CharacterQuiz],
      providers: [
        { provide: CharacterQuizFacade, useValue: facadeMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ mode: 'practice', listId: 'list-1' }),
              queryParamMap: convertToParamMap({
                type: 'characterToReading',
                answerType: 'open',
                order: 'list',
              }),
            },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterQuiz);
    component = fixture.componentInstance;
    fixture.detectChanges(false);
    await fixture.whenStable();
  });

  it('loads quiz configuration from the route', () => {
    expect(facadeMock.load).toHaveBeenCalledWith({
      listId: 'list-1',
      characterQuizType: 'characterToReading',
      answerType: 'open',
      mode: 'practice',
      order: 'list',
    });
  });

  it('renders the empty-list confirmation state', () => {
    facadeMock.emptyList.set(true);
    fixture.detectChanges(false);

    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('This list has no characters');
  });

  it('shows immediate feedback during practice', async () => {
    facadeMock.questions.set([{
      prompt: 'What is the reading?',
      acceptedAnswers: ['gaku'],
      characterUnicode: '5B66',
    }]);
    facadeMock.hasAnswered.set(true);
    facadeMock.lastAnswerCorrect.set(false);
    await fixture.whenStable();
    fixture.detectChanges(false);

    expect(fixture.nativeElement.textContent).toContain('Incorrect. Accepted answer: gaku');
  });

  it('does not reveal answer feedback during evaluation', async () => {
    component.config.set({
      listId: 'list-1',
      characterQuizType: 'characterToReading',
      answerType: 'multiple',
      mode: 'evaluation',
      order: 'list',
    });
    facadeMock.questions.set([{
      prompt: 'What is the reading?',
      acceptedAnswers: ['gaku'],
      characterUnicode: '5B66',
      options: [
        { value: 'gaku', label: 'gaku' },
        { value: 'manabu', label: 'manabu' },
      ],
    }]);
    facadeMock.hasAnswered.set(true);
    facadeMock.lastAnswerCorrect.set(true);
    await fixture.whenStable();
    fixture.detectChanges(false);

    expect(fixture.nativeElement.querySelector('.quiz-feedback')).toBeNull();
    expect(fixture.nativeElement.querySelector('.quiz-option--correct')).toBeNull();
  });

  it('shows the answer review after an evaluation', () => {
    component.config.set({
      listId: 'list-1',
      characterQuizType: 'characterToReading',
      answerType: 'open',
      mode: 'evaluation',
      order: 'list',
    });
    facadeMock.isFinished.set(true);
    facadeMock.score.set(0);
    facadeMock.questions.set([
      {
        prompt: 'What is the reading?',
        acceptedAnswers: ['gaku'],
        characterUnicode: '5B66',
      },
    ]);
    facadeMock.answers.set([
      { characterUnicode: '5B66', answer: 'manabu', correct: false },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Evaluation complete');
    expect(fixture.nativeElement.textContent).toContain('Expected: gaku');
    expect(fixture.nativeElement.textContent).toContain('Your answer: manabu');
  });
});
