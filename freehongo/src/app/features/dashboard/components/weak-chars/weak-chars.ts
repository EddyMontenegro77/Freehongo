import { Component, input, output, viewChild } from '@angular/core';
import { StoredCharacterStat } from '../../../../shared/models/quizes/quizes-storage.interface';
import { Card } from '../../../../shared/components/card/card';
import { DatePipe } from '@angular/common';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { AnswerTypePipe } from '../../../../shared/pipes/answer-type.pipe';
import { Progressbar } from '../../../../shared/components/progressbar/progressbar';
import { Chip } from '../../../../shared/components/chip/chip';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Modal } from '../../../../shared/components/modal/modal';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';

@Component({
  imports: [
    DatePipe,
    UnicodeCharacterPipe,
    AnswerTypePipe,
    Progressbar,
    Chip,
    ActionBtn,
    Modal,
    IconBtn,
  ],
  selector: 'app-weak-chars',
  styleUrl: './weak-chars.scss',
  templateUrl: './weak-chars.html',
})
export class WeakChars {
  readonly data = input.required<StoredCharacterStat[]>();
  readonly characterSelected = output<string>();

  infoModal = viewChild<Modal>('infoModal');
  openModal = (): void => this.infoModal()?.open();
  closeModal = (): void => this.infoModal()?.close();

  protected accuracy(stat: StoredCharacterStat): number {
    return stat.attempts ? Math.round((stat.correctCount / stat.attempts) * 100) : 0;
  }
}
