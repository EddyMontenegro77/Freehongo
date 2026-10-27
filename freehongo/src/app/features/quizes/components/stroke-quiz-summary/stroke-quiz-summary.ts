import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Table } from '../../../../shared/components/table/table';
import { QuizMode } from '../../../../shared/models/quizes/quizes.interface';
import { UnicodeCharacterPipe } from '../../../../shared/pipes/unicode.pipe';
import {
  buildOverall,
  buildRows,
  CharacterResult,
  SummaryRow,
} from '../../utils/stroke-quiz-results';
import { TableColumn } from '../../../../shared/components/table/interface/table.interface';

@Component({
  selector: 'app-stroke-quiz-summary',
  imports: [ActionBtn, Table],
  templateUrl: './stroke-quiz-summary.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stroke-quiz-summary.scss',
})
export class StrokesQuizSummary {
  readonly mode = input.required<QuizMode>();
  readonly results = input.required<CharacterResult[]>();

  readonly retryRequested = output<void>();
  readonly exitRequested = output<void>();

  private readonly unicodePipe = new UnicodeCharacterPipe();
  private readonly toCharacter = (unicode: string): string => this.unicodePipe.transform(unicode);

  readonly overall = computed(() => buildOverall(this.results()));
  readonly rows = computed(() => buildRows(this.results(), this.toCharacter));

  readonly columns: TableColumn<SummaryRow>[] = [
    { key: 'character', header: 'Character', align: 'center' },
    { key: 'result', header: 'Result' },
    { key: 'strokes', header: 'Strokes', align: 'center' },
    { key: 'detail', header: 'Detail' },
  ];

  retry = (): void => this.retryRequested.emit();

  exit = (): void => this.exitRequested.emit();
}
