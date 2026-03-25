import { Component, computed, effect, input, output, signal } from '@angular/core';
import { ActionBtn } from '../action-btn/action-btn';

@Component({
  selector: 'app-pagination-controller',
  standalone: true,
  imports: [ActionBtn],
  templateUrl: './pagination-controller.html',
  styleUrl: './pagination-controller.scss',
})
export class PaginationController {
  currentPage = input<number>(1);
  totalPages = input<number>(1);

  selectedPage = signal<number>(1);

  pageChange = output<number>();

  canSelectPage = computed(() => {
    const page = this.selectedPage();
    return page >= 1;
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
