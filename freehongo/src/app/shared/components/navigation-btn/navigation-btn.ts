import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation-btn',
  imports: [],
  templateUrl: './navigation-btn.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navigation-btn.scss',
})
export class NavigationBtn {
  constructor(private router: Router) {}

  title = input.required<string>();
  icon = input<string | null>(null);
  showText = input<boolean>(true);
  route = input<string[] | undefined>(undefined);
  keepIconColors = input<boolean>(false);
  bold = input<boolean>(false);

  disabled = input<boolean>(false);
  busy = signal<boolean>(false);
  fullWidth = input<boolean>(false);

  async navigate(): Promise<void> {
    if (this.disabled() || this.busy()) return;

    this.busy.set(true);

    try {
      await this.router.navigate(this.route() ?? ['/']);
    } finally {
      this.busy.set(false);
    }
  }
}
