import { Component, input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;

  title = input.required<string>();

  open(): void {
    this.dialog.nativeElement.showModal();
  }

  close(): void {
    this.dialog.nativeElement.close();
  }
}
