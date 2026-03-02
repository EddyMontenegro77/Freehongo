import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WritingCanvas } from './features/writing/components/writing-canvas/writing-canvas';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WritingCanvas],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('freehongo');
}
