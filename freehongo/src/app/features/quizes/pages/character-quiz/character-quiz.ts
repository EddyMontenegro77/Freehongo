import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { ListSource } from '../../../../shared/models/lists/list.model';
import { Card } from '../../../../shared/components/card/card';
import { Progressbar } from '../../../../shared/components/progressbar/progressbar';

const QUIZ_INSTRUCTIONS: Record<CharacterQuizType, string> = {
  characterToReading: 'What is the reading of this character?',
  readingToCharacter: 'Which character has this reading?',
  characterToMeaning: 'What does this character mean?',
  meaningToCharacter: 'Which character has this meaning?',
};

const ANSWER_HINTS: Record<CharacterQuizType, string> = {
  characterToReading: 'Romaji, hiragana or katakana all work.',
  characterToMeaning: 'Answer in English.',
  readingToCharacter: 'Type the character.',
  meaningToCharacter: 'Type the character.',
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

@Component({
  selector: 'app-character-quiz',
  imports: [ActionBtn, ErrorState, LoadingState, Confirmation, InputField, Card, Progressbar],
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

  readonly quizInstruction = computed(
    () => QUIZ_INSTRUCTIONS[this.config()?.characterQuizType ?? 'characterToReading'],
  );

  readonly answerHint = computed(
    () => ANSWER_HINTS[this.config()?.characterQuizType ?? 'characterToReading'],
  );

  readonly quizTags = computed<string[]>(() => {
    const config = this.config();

    if (!config) {
      return [];
    }

    const tags = [
      config.answerType === 'multiple' ? 'Multiple choice' : 'Open answer',
      config.order === 'random' ? 'Random order' : 'List order',
    ];

    if (config.source === 'public') {
      tags.push('Public list');
    } else if (config.source === 'official') {
      tags.push('Official list');
    }

    return tags;
  });

  readonly accuracy = computed(() => {
    const total = this.quizFacade.questions().length;
    return total > 0 ? Math.round((this.quizFacade.score() / total) * 100) : 0;
  });

  readonly resultMessage = computed(() => {
    const value = this.accuracy();

    if (value === 100) {
      return 'Perfect score!';
    }

    if (value >= 80) {
      return 'Great job!';
    }

    if (value >= 50) {
      return 'Good effort, keep practicing.';
    }

    return 'Keep going, every attempt helps.';
  });

  private readonly totalTimeMs = computed(() =>
    this.quizFacade.answers().reduce((sum, answer) => sum + answer.responseTimeMs, 0),
  );

  readonly totalTimeLabel = computed(() => formatDuration(this.totalTimeMs()));

  readonly averageTimeLabel = computed(() => {
    const count = this.quizFacade.answers().length;
    return formatDuration(count > 0 ? this.totalTimeMs() / count : 0);
  });

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

  optionVariant = (isAccepted: boolean): 'light' | 'success' | 'danger' => {
    if (!this.isPractice() || !this.quizFacade.hasAnswered()) {
      return 'light';
    }

    return isAccepted ? 'success' : 'danger';
  };

  getAnswerResult = (characterUnicode: string) => {
    const result = this.quizFacade
      .answers()
      .find((answer) => answer.characterUnicode === characterUnicode);

    return result && 'answer' in result ? result : undefined;
  };

  goToQuizMenu = async (): Promise<void> => {
    await this.router.navigate(['/quizzes']);
  };

  retry = (): Promise<void> => {
    const config = this.config();
    return config ? this.quizFacade.load(config) : Promise.resolve();
  };

  private readConfig(): CharacterQuizConfig {
    return {
      listId: this.readListId(this.route.snapshot.paramMap.get('listId')),
      ...this.readSourceConfig(this.route.snapshot.queryParamMap.get('source')),
      mode: this.readMode(this.route.snapshot.paramMap.get('mode')),
      characterQuizType: this.readQuizType(this.route.snapshot.queryParamMap.get('type')),
      answerType: this.readAnswerType(this.route.snapshot.queryParamMap.get('answerType')),
      order: this.readOrder(this.route.snapshot.queryParamMap.get('order')),
    };
  }

  private readSource(value: string | null): ListSource {
    return value === 'public' || value === 'official' ? value : 'private';
  }

  private readSourceConfig(value: string | null): { source?: ListSource } {
    const source = this.readSource(value);
    return source === 'private' ? {} : { source };
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
