import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ListsDisplay } from '../../../../shared/components/character-lists/lists-display/lists-display';
import { QuizConfigWindow } from '../../components/quiz-config-window/quiz-config-window';
import { QuizSettings } from '../../../../shared/models/quizes/quizes.interface';

@Component({
  selector: 'app-quizes',
  imports: [ListsDisplay, QuizConfigWindow],
  templateUrl: './quizes.html',
  styleUrl: './quizes.scss',
})
export class Quizes {
  private readonly router = inject(Router);
  @ViewChild(QuizConfigWindow, { static: true }) private configWindow!: QuizConfigWindow;

  private selectedListId: string | null = null;

  openQuizConfig = (listId: string): void => {
    this.selectedListId = listId;
    this.configWindow.open();
  };

  takeQuiz = async (settings: QuizSettings): Promise<void> => {
    if (!this.selectedListId) {
      return;
    }

    if (settings.answerType === 'strokeWriting') {
      await this.router.navigate(['/quizes', 'strokes', settings.mode, this.selectedListId], {
        queryParams: {
          order: settings.order,
        },
      });
    } else {
      await this.router.navigate(['/quizes', settings.mode, this.selectedListId], {
        queryParams: {
          type: settings.characterQuizType,
          answerType: settings.answerType,
          order: settings.order,
        },
      });
    }
  };
}
