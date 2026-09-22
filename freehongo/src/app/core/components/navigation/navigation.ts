import { Component } from '@angular/core';
import { NavigationBtn } from '../../../shared/components/navigation-btn/navigation-btn';

@Component({
  selector: 'app-navigation',
  imports: [NavigationBtn],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation {}
