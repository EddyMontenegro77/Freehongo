import { Component, inject, input, ViewChild } from '@angular/core';
import { Modal } from '../../modal/modal';
import { ListsDisplay } from '../lists-display/lists-display';
import { ListsFacade } from '../../../../features/lists/services/lists.facade.service';
import { FeedbackToast } from '../../feedback-toast/feedback-toast';

@Component({
  selector: 'app-list-popup',
  imports: [Modal, ListsDisplay, FeedbackToast],
  templateUrl: './list-popup.html',
  styleUrl: './list-popup.scss',
})
export class ListPopup {
  @ViewChild('listPopupModal') listPopupModal!: Modal;
  @ViewChild('feedbackToast') feedbackToast!: FeedbackToast;
  unicode = input.required<string>();
  private readonly listsFacade = inject(ListsFacade);

  async addCharacterToList(listId: string): Promise<void> {
    try {
      const added = await this.listsFacade.addCharacterToList(listId, this.unicode());

      this.closelistPopupModal();
      this.feedbackToast.show(
        added ? 'Character added to your list.' : 'Character is already in this list.',
      );
    } catch (error) {
      console.error(error);
      this.feedbackToast.show('Could not add character to the list.');
    }
  }

  openlistPopupModal = (): void => {
    this.listPopupModal.open();
  };

  closelistPopupModal = (): void => {
    this.listPopupModal.close();
  };
}
