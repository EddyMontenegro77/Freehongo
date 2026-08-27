import { Component } from '@angular/core';
import { ActionBtn } from '../../../../shared/components/action-btn/action-btn';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [ActionBtn],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  constructor(private router: Router) {}
  navigateTo = (route: string): void => {
    this.router.navigate([route]);
  };
}
