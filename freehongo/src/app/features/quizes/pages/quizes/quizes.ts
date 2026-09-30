import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ListsDisplay } from '../../../../shared/components/character-lists/lists-display/lists-display';

@Component({
  selector: 'app-quizes',
  imports: [ListsDisplay],
  templateUrl: './quizes.html',
  styleUrl: './quizes.scss',
})
export class Quizes {
  private readonly router = inject(Router);

  takeQuiz = async (listId: string): Promise<void> => {
    await this.router.navigate(['/quizes', 'practice', listId], {
      queryParams: {
        type: 'characterToReading',
        answerType: 'multiple',
        order: 'random',
      },
    });
  };
}
