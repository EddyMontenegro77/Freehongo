import { Component, ViewChild, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { IconBtn } from '../../../../shared/components/icon-btn/icon-btn';
import { Modal } from '../../../../shared/components/modal/modal';
import { Table } from '../../../../shared/components/table/table';
import { TableColumn } from '../../../../shared/components/table/interface/table.interface';
import { ThemeService } from '../../../../shared/services/theme/theme.service';
import {
  StrokeValidationResult,
  StrokeErrorType,
} from '../../models/stroke-validation-result.interface';
import { strokeErrorLabel } from '../../mappers/stroke-error-label.mapper';
import { List } from '../../../../shared/components/list/list';

@Component({
  selector: 'app-writing-validation',
  standalone: true,
  imports: [ActionBtn, Table, Modal, IconBtn, List],
  templateUrl: './writing-validation.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './writing-validation.scss',
})
export class WritingValidation {
  @ViewChild('expectedModal') expectedModal!: Modal;
  @ViewChild('infoModal') infoModal!: Modal;

  expectedUrl = input.required<string>();
  hasValidationResults = input.required<boolean>();
  isValidSequence = input.required<boolean>();
  sequenceError = input<string>('');
  strokeResults = input.required<StrokeValidationResult[]>();

  columns: TableColumn<StrokeValidationResult>[] = [
    { key: 'strokeIndex', header: 'Stroke', formatter: (v) => Number(v) + 1 },
    { key: 'isValid', header: 'Valid', formatter: (v) => (v ? 'Yes' : 'No') },
    {
      key: 'errorType',
      header: 'Error',
      formatter: (v) => strokeErrorLabel(v as StrokeErrorType),
    },
  ];

  themeService = inject(ThemeService);

  openExpectedModal = (): void => {
    this.expectedModal.open();
  };

  closeExpectedModal = (): void => {
    this.expectedModal.close();
  };

  openInfoModal = (): void => {
    this.infoModal.open();
  };

  closeInfoModal = (): void => {
    this.infoModal.close();
  };
}
