import { Component, input } from '@angular/core';
import { TableColumn, TableRow } from './interface/table.interface';

export type TableAlignment = 'left' | 'center' | 'right';

@Component({
  selector: 'app-table',
  imports: [],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table {
  headers = input.required<TableColumn<any>[]>();
  rows = input.required<any[]>();
  showRow = input<(row: TableRow) => boolean>();
  tableAlignment = input<TableAlignment>('center');

  getCellValue(row: TableRow, column: TableColumn<TableRow>): unknown {
    const value = row[column.key];
    if (!column.formatter) return value;
    return column.formatter(value, row);
  }

  isColumnVisible(row: TableRow, column: TableColumn<TableRow>): boolean {
    if (column.visible === undefined) return true;
    if (typeof column.visible === 'boolean') return column.visible;
    return column.visible(row);
  }

  isRowVisible(row: TableRow): boolean {
    return this.showRow()?.(row) ?? true;
  }
}
