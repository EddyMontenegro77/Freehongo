import { Routes } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';
import { CharacterPicker } from './features/characters/pages/character-picker/character-picker';

export const routes: Routes = [
  { path: 'writing/:type/:unicode', component: WritingPractice },
  { path: 'characters/picker', component: CharacterPicker },
];
