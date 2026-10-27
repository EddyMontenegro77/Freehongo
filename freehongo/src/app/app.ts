import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme/theme.service';
import { Stroke } from './shared/models/writing/stroke.model';
import { Navigation } from './core/components/navigation/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('freehongo');
  tempStrokes: Stroke[] = [];

  constructor(private themeService: ThemeService) {
    this.themeService.initTheme();
  }
}
