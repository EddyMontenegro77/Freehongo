import { Component, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { ListsDisplay, QuizListSelection } from '../../../../shared/components/character-lists/lists-display/lists-display';
import { QuizConfigWindow } from '../../components/quiz-config-window/quiz-config-window';
import { QuizSettings } from '../../../../shared/models/quizes/quizes.interface';
import { shortenUuid } from '../../../../shared/utils/urls.utils';
import { ListSource } from '../../../../shared/models/lists/list.model';

@Component({
  selector: 'app-quizes',
  imports: [ListsDisplay, QuizConfigWindow],
  templateUrl: './quizes.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './quizes.scss',
})
export class Quizes {
  private readonly router = inject(Router);
  @ViewChild(QuizConfigWindow, { static: true }) private configWindow!: QuizConfigWindow;

  private selectedListId: string | null = null;
  private selectedListSource: ListSource = 'private';

  openQuizConfig = (selection: string | QuizListSelection): void => {
    this.selectedListId = typeof selection === 'string' ? selection : selection.listId;
    this.selectedListSource = typeof selection === 'string' ? 'private' : selection.source;
    this.configWindow.open();
  };

  takeQuiz = async (settings: QuizSettings): Promise<void> => {
    if (!this.selectedListId) {
      return;
    }

    if (settings.answerType === 'strokeWriting') {
      await this.router.navigate(
        ['/quizzes', 'strokes', settings.mode, shortenUuid(this.selectedListId)],
        {
          queryParams: {
            order: settings.order,
            ...(this.selectedListSource === 'private' ? {} : { source: this.selectedListSource }),
          },
        },
      );
    } else {
      await this.router.navigate(['/quizzes', settings.mode, shortenUuid(this.selectedListId)], {
        queryParams: {
          type: settings.characterQuizType,
          answerType: settings.answerType,
          order: settings.order,
          ...(this.selectedListSource === 'private' ? {} : { source: this.selectedListSource }),
        },
      });
    }
  };
}
