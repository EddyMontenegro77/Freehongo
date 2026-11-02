import { Component, input, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { IconBtn } from '../icon-btn/icon-btn';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-modal',
  imports: [IconBtn],
  templateUrl: './modal.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './modal.scss',
})
export class Modal {
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;

  constructor(public themeService: ThemeService) {}

  title = input.required<string>();

  open(): void {
    this.dialog.nativeElement.showModal();
  }

  close = (): void => {
    this.dialog.nativeElement.close();
  };
}
