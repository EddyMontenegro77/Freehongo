import { Routes } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';
import { CharacterPicker } from './features/characters/pages/character-picker/character-picker';
import { CharacterInfo } from './features/characters/pages/character-info/character-info';
import { Home } from './features/home/pages/home/home';
import { Lists } from './features/lists/pages/lists/lists';

export const routes: Routes = [
  { path: 'writing/:type/:unicode', component: WritingPractice },
  { path: 'characters/picker', component: CharacterPicker },
  { path: 'characters/info/:type/:unicode', component: CharacterInfo },
  { path: 'lists', component: Lists },
  { path: '', component: Home },
];
