import { Component, input, output } from '@angular/core';
import { StoredCharacterStat } from '../../../../shared/models/quizes/quizes-storage.interface';
import { Card } from '../../../../shared/components/card/card';
import { DatePipe } from '@angular/common';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import { AnswerTypePipe } from '../../../../shared/pipes/answer-type.pipe';

@Component({
  imports: [Card, DatePipe, UnicodeCharacterPipe, AnswerTypePipe],
  selector: 'app-weak-chars',
  styleUrl: './weak-chars.scss',
  templateUrl: './weak-chars.html',
})
export class WeakChars {
  readonly data = input.required<StoredCharacterStat[]>();
  readonly characterSelected = output<string>();

  protected accuracy(stat: StoredCharacterStat): number {
    return stat.attempts ? Math.round((stat.correctCount / stat.attempts) * 100) : 0;
  }
}
