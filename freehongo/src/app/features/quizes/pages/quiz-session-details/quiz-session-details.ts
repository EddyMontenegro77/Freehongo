import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizEvaluationStorageService } from '../../services/quiz-evaluation-storage.service';
import { QuizSessionDetail } from '../../../../shared/models/quizes/quizes-storage.interface';
import { DatePipe, Location } from '@angular/common';
import { ResponseTimePipe } from '../../../../shared/pipes/response-time.pipe';
import {
  SegmentedControl,
  SegmentedOption,
} from '../../../../shared/components/segmented-control/segmented-control';
import { CharacterQuizTypePipe } from '../../../../shared/pipes/character-quiz-type.pipe';
import { AnswerTypePipe } from '../../../../shared/pipes/answer-type.pipe';
import { Card } from '../../../../shared/components/card/card';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';

@Component({
  imports: [
    DatePipe,
    ResponseTimePipe,
    SegmentedControl,
    CharacterQuizTypePipe,
    AnswerTypePipe,
    UnicodeCharacterPipe,
    Card,
    IconBtn,
  ],
  selector: 'app-quiz-session-details',
  styleUrl: './quiz-session-details.scss',
  templateUrl: './quiz-session-details.html',
})
export class QuizSessionDetails {
  private readonly storage = inject(QuizEvaluationStorageService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly filterOptions: ReadonlyArray<SegmentedOption<boolean>> = [
    { label: 'All', value: false },
    { label: 'Mistakes', value: true },
  ];

  readonly onlyErrors = signal(false);

  readonly visibleAnswers = computed(() => {
    const answers = this.detail()?.answers ?? [];
    return this.onlyErrors() ? answers.filter((a) => !a.isCorrect) : answers;
  });

  readonly durationMs = computed(() => {
    const s = this.detail()?.session;
    return s ? s.finishedAt.getTime() - s.startedAt.getTime() : 0;
  });

  readonly detail = signal<QuizSessionDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly correctCount = computed(
    () => this.detail()?.answers.filter((a) => a.isCorrect).length ?? 0,
  );
  readonly accuracy = computed(() => {
    const total = this.detail()?.answers.length ?? 0;
    return total ? Math.round((this.correctCount() / total) * 100) : 0;
  });
  readonly averageResponseMs = computed(() => {
    const answers = this.detail()?.answers ?? [];
    return answers.length
      ? answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / answers.length
      : 0;
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('sessionId');
    try {
      const detail = id ? await this.storage.getSessionDetail(id) : null;
      this.detail.set(detail);
      this.notFound.set(!detail);
    } catch (error) {
      console.error('Failed to load quiz session', error);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  back = async (): Promise<void> => {
    this.location.back();
  };
}
