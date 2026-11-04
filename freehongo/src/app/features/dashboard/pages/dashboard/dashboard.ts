import { Component } from '@angular/core';
import { Milestone, Progressbar } from '../../../../shared/components/progressbar/progressbar';

@Component({
  imports: [Progressbar],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  milestones: Milestone[] = [
    {
      value: 50,
      label: 'Half',
    },
    {
      value: 80,
      label: 'Eighty',
    },
  ];
}
