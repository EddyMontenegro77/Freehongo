import { Component, input } from '@angular/core';
import { GeneralSummary } from '../../models/dashboard.models';

@Component({
  imports: [],
  selector: 'app-summary',
  styleUrl: './summary.scss',
  templateUrl: './summary.html',
})
export class Summary {
  data = input.required<GeneralSummary>();
}
