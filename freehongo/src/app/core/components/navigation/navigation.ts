import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavigationBtn } from '../../../shared/components/navigation-btn/navigation-btn';

@Component({
  selector: 'app-navigation',
  imports: [NavigationBtn],
  templateUrl: './navigation.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navigation.scss',
})
export class Navigation {}
