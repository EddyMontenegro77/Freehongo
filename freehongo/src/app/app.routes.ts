import { Routes } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';

export const routes: Routes = [{ path: 'writing/:type/:unicode', component: WritingPractice }];
