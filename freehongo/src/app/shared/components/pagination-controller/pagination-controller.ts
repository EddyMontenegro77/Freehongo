import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActionBtn } from '../action-btn/action-btn';
import { InputField } from '../input/input';

@Component({
  selector: 'app-pagination-controller',
  standalone: true,
  imports: [ActionBtn, InputField],
  templateUrl: './pagination-controller.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pagination-controller.scss',
})
export class PaginationController {
  currentPage = input<number>(1);
  totalPages = input<number>(1);

  selectedPage = signal<number>(1);

  pageChange = output<number>();

  canSelectPage = computed(() => {
    const page = this.selectedPage();

    return (
      Number.isInteger(page) &&
      page >= 1 &&
      page <= this.totalPages() &&
      page !== this.currentPage()
    );
  });

  constructor() {
    effect(() => {
      this.selectedPage.set(this.currentPage());
    });
  }

  previousPage = (): void => {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  };

  nextPage = (): void => {
    this.pageChange.emit(this.currentPage() + 1);
  };

  onPageValueChange = (value: string): void => {
    this.selectedPage.set(value === '' ? 0 : Number(value));
  };

  onPageInput = (event: Event): void => {
    const rawValue = (event.target as HTMLInputElement).value;
    this.selectedPage.set(rawValue === '' ? 0 : Number(rawValue));
  };

  selectPage = (): void => {
    if (this.canSelectPage()) {
      this.pageChange.emit(this.selectedPage());
    }
  };
}
