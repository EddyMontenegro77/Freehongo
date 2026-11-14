import { Component, input } from '@angular/core';
import { CategoryProgress, DashboardCategory } from '../../models/dashboard.models';
import { KeyValuePipe } from '@angular/common';

@Component({
  imports: [KeyValuePipe],
  selector: 'app-categories',
  styleUrl: './categories.scss',
  templateUrl: './categories.html',
})
export class Categories {
  data = input.required<Record<DashboardCategory, CategoryProgress>>();
}
