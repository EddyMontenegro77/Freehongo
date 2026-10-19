import { Component } from '@angular/core';
import { GoogleLoginBtn } from '../google-login-btn/google-login-btn';

@Component({
  selector: 'app-signup',
  imports: [GoogleLoginBtn],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {}
