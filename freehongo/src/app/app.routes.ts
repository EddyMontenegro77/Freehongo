import { Routes } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';
import { CharacterPicker } from './features/characters/pages/character-picker/character-picker';
import { CharacterInfo } from './features/characters/pages/character-info/character-info';
import { Home } from './features/home/pages/home/home';
import { Lists } from './features/lists/pages/lists/lists';
import { ListsDisplay } from './shared/components/character-lists/lists-display/lists-display';

export const routes: Routes = [
  { path: 'writing/:type/:unicode', component: WritingPractice },
  { path: 'characters/picker', component: CharacterPicker },
  { path: 'characters/info/:type/:unicode', component: CharacterInfo },
  { path: 'lists', component: Lists },
  { path: 'lists/displaytest', component: ListsDisplay },
  { path: '', component: Home },
];
