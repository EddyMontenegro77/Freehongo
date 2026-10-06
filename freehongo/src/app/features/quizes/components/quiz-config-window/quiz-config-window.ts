import { Component, output, signal, ViewChild } from '@angular/core';
import { Modal } from '../../../../shared/components/modal/modal';
import { SelectField, SelectOption } from '../../../../shared/components/select/select';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import {
  CharacterQuizType,
  ImplementedAnswerType,
  QuizMode,
  QuizOrder,
  QuizSettings,
} from '../../../../shared/models/quizes/quizes.interface';

@Component({
  selector: 'app-quiz-config-window',
  imports: [Modal, SelectField, ActionBtn],
  templateUrl: './quiz-config-window.html',
  styleUrl: './quiz-config-window.scss',
})
export class QuizConfigWindow {
  @ViewChild('modal') private modal?: Modal;

  readonly configSubmitted = output<QuizSettings>();

  mode: QuizMode = 'practice';
  quizType: CharacterQuizType = 'characterToReading';
  answerType = signal<ImplementedAnswerType>('multiple');
  order: QuizOrder = 'random';

  readonly modeOptions: SelectOption<QuizMode>[] = [
    { label: 'Practice', value: 'practice' },
    { label: 'Evaluation', value: 'evaluation' },
  ];

  readonly quizTypeOptions: SelectOption<CharacterQuizType>[] = [
    { label: 'Character to reading', value: 'characterToReading' },
    { label: 'Reading to character', value: 'readingToCharacter' },
    { label: 'Character to meaning', value: 'characterToMeaning' },
    { label: 'Meaning to character', value: 'meaningToCharacter' },
  ];

  readonly answerTypeOptions: SelectOption<'multiple' | 'open' | 'strokeWriting'>[] = [
    { label: 'Multiple choice', value: 'multiple' },
    { label: 'Open answer', value: 'open' },
    { label: 'Stroke Writing', value: 'strokeWriting' },
  ];

  readonly orderOptions: SelectOption<QuizOrder>[] = [
    { label: 'Random', value: 'random' },
    { label: 'List order', value: 'list' },
  ];

  open = (): void => {
    this.modal?.open();
  };

  close = (): void => {
    this.modal?.close();
  };

  submit = (): void => {
    this.configSubmitted.emit({
      mode: this.mode,
      characterQuizType: this.quizType,
      answerType: this.answerType(),
      order: this.order,
    });
    this.close();
  };
}
