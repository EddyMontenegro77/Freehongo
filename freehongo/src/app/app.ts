import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';
import { Stroke } from './shared/models/writing/stroke.model';
import { ThemeService } from './shared/services/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WritingPractice],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('freehongo');
  tempStrokes: Stroke[] = [];

  constructor(private themeService: ThemeService) {
    this.themeService.initTheme();
  }
}
