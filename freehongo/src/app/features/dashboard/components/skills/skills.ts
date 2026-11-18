import { Component, input } from '@angular/core';
import { DashboardSkill, SkillProgress } from '../../models/dashboard.models';
import { KeyValuePipe } from '@angular/common';
import { ResponseTimePipe } from '../../../../shared/pipes/response-time.pipe';

@Component({
  imports: [KeyValuePipe, ResponseTimePipe],
  selector: 'app-skills',
  styleUrl: './skills.scss',
  templateUrl: './skills.html',
})
export class Skills {
  data = input.required<Record<DashboardSkill, SkillProgress>>();

  readonly keepOrder = (): number => 0;
}
