import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Table } from './table';
import { TableColumn } from './interface/table.interface';

describe('Table', () => {
  let component: Table;
  let fixture: ComponentFixture<Table>;

  type Row = { name: string; strokes: number; passed: boolean };

  const headers: TableColumn<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'strokes', header: 'Strokes', align: 'right' },
    {
      key: 'passed',
      header: 'Passed',
      formatter: (value) => (value ? 'Yes' : 'No'),
    },
  ];

  const rows: Row[] = [
    { name: 'A', strokes: 3, passed: true },
    { name: 'B', strokes: 5, passed: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Table],
    }).compileComponents();

    fixture = TestBed.createComponent(Table);
    fixture.componentRef.setInput('headers', headers);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render table headers', () => {
    const ths = fixture.nativeElement.querySelectorAll('th');
    expect(ths).toHaveLength(3);
    expect(ths[0].textContent.trim()).toBe('Name');
    expect(ths[1].textContent.trim()).toBe('Strokes');
    expect(ths[2].textContent.trim()).toBe('Passed');
  });

  it('should render table rows and formatted values', () => {
    const trs = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(trs).toHaveLength(2);

    const firstRowCells = trs[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent.trim()).toBe('A');
    expect(firstRowCells[1].textContent.trim()).toBe('3');
    expect(firstRowCells[2].textContent.trim()).toBe('Yes');
  });
});
