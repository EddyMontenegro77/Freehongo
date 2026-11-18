import { Component } from '@angular/core';
import { ActionBtn } from '../../../shared/components/action-btn/action-btn';

@Component({
  imports: [ActionBtn],
  selector: 'app-styles-test',
  styleUrl: './styles-test.scss',
  templateUrl: './styles-test.html',
})
export class StylesTest {
  nothing = (): void => {};
}
