import { Component } from '@angular/core';
import { input } from '@angular/core';

@Component({
  selector: 'app-icon-btn',
  imports: [],
  templateUrl: './icon-btn.html',
  styleUrl: './icon-btn.scss',
})
export class IconBtn {
  title = input.required<string>();
  action = input.required<() => void>();
  iconSrc = input.required<string>();
}
