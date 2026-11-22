import { Component, input, signal } from '@angular/core';
import { GeneralSummary, MasteryLevel } from '../../models/dashboard.models';
import { ResponseTimePipe } from '../../../../shared/pipes/response-time.pipe';
import { Card } from '../../../../shared/components/card/card';
import { DecimalPipe, TitleCasePipe } from '@angular/common';

@Component({
  imports: [ResponseTimePipe, Card, DecimalPipe, TitleCasePipe],
  selector: 'app-summary',
  styleUrl: './summary.scss',
  templateUrl: './summary.html',
})
export class Summary {
  data = input.required<GeneralSummary>();
  masteryMap: Record<MasteryLevel, number> = {
    new: 0,
    beginner: 25,
    intermediate: 50,
    mastered: 100,
  };
}
