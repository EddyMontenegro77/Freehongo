export type TableRow = object;

export type TableCellAlign = 'left' | 'center' | 'right';

export interface TableColumn<T extends object = TableRow> {
  key: Extract<keyof T, string>; // Keep only keys of T
  header: string;
  align?: TableCellAlign;
  formatter?: (value: unknown, row: T) => string | number | boolean | null | undefined;
  visible?: boolean | ((row: T) => boolean);
}

export interface TableConfig<T extends object = TableRow> {
  columns: TableColumn<T>[];
  rows: T[];
  showRow?: (row: T) => boolean;
}
