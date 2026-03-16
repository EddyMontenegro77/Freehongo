import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WritingCanvas } from './features/writing/components/writing-canvas/writing-canvas';
import { Stroke } from './shared/models/writing/stroke.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WritingCanvas],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('freehongo');
  tempStrokes: Stroke[] = [];
}
