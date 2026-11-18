import { Component } from '@angular/core';
import { ActionBtn } from '../../../shared/components/action-btn/action-btn';
import { IconBtn } from '../../../shared/components/icon-btn/icon-btn';

@Component({
  imports: [ActionBtn, IconBtn],
  selector: 'app-styles-test',
  styleUrl: './styles-test.scss',
  templateUrl: './styles-test.html',
})
export class StylesTest {
  nothing = (): void => {};
}
