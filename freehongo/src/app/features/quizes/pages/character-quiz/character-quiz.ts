import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { ErrorState } from '../../../../shared/components/app-state/error-state/error-state';
import { LoadingState } from '../../../../shared/components/app-state/loading-state/loading-state';
import { Confirmation } from '../../../../shared/components/confirmation/confirmation';
import { InputField } from '../../../../shared/components/input/input';
import {
  AnswerType,
  CharacterQuizConfig,
  CharacterQuizType,
  QuizMode,
  QuizOrder,
} from '../../../../shared/models/quizes/quizes.interface';
import { CharacterQuizFacade } from '../../services/character-quiz.facade.service';
import { expandUuid } from '../../../../shared/utils/urls.utils';

@Component({
  selector: 'app-character-quiz',
  imports: [ActionBtn, ErrorState, LoadingState, Confirmation, InputField],
  templateUrl: './character-quiz.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-quiz.scss',
})
export class CharacterQuiz {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly quizFacade = inject(CharacterQuizFacade);

  readonly answer = signal('');
  readonly config = signal<CharacterQuizConfig | null>(null);

  constructor() {
    const config = this.readConfig();
    this.config.set(config);
    void this.quizFacade.load(config);
  }

  submitAnswer = (answer: string): void => {
    this.quizFacade.submitAnswer(answer);
  };

  submitOpenAnswer = (): void => {
    this.submitAnswer(this.answer());
  };

  nextQuestion = (): void => {
    this.answer.set('');
    this.quizFacade.nextQuestion();
  };

  isPractice = (): boolean => this.config()?.mode === 'practice';

  getAnswerResult = (characterUnicode: string) => {
    const result = this.quizFacade
      .answers()
      .find((answer) => answer.characterUnicode === characterUnicode);

    return result && 'answer' in result ? result : undefined;
  };

  goToQuizMenu = async (): Promise<void> => {
    await this.router.navigate(['/quizes']);
  };

  retry = (): Promise<void> => {
    const config = this.config();
    return config ? this.quizFacade.load(config) : Promise.resolve();
  };

  private readConfig(): CharacterQuizConfig {
    return {
      listId: this.readListId(this.route.snapshot.paramMap.get('listId')),
      mode: this.readMode(this.route.snapshot.paramMap.get('mode')),
      characterQuizType: this.readQuizType(this.route.snapshot.queryParamMap.get('type')),
      answerType: this.readAnswerType(this.route.snapshot.queryParamMap.get('answerType')),
      order: this.readOrder(this.route.snapshot.queryParamMap.get('order')),
    };
  }

  private readListId(value: string | null): string {
    try {
      return expandUuid(value ?? '');
    } catch {
      return '';
    }
  }

  private readMode(value: string | null): QuizMode {
    return value === 'evaluation' ? 'evaluation' : 'practice';
  }

  private readOrder(value: string | null): QuizOrder {
    return value === 'list' ? 'list' : 'random';
  }

  private readAnswerType(value: string | null): AnswerType {
    return value === 'open' ? 'open' : 'multiple';
  }

  private readQuizType(value: string | null): CharacterQuizType {
    const supportedTypes: CharacterQuizType[] = [
      'characterToReading',
      'readingToCharacter',
      'characterToMeaning',
      'meaningToCharacter',
    ];

    return supportedTypes.includes(value as CharacterQuizType)
      ? (value as CharacterQuizType)
      : 'characterToReading';
  }
}
