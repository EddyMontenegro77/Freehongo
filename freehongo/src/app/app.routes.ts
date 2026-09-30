import { Routes } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';
import { CharacterPicker } from './features/characters/pages/character-picker/character-picker';
import { CharacterInfo } from './features/characters/pages/character-info/character-info';
import { Home } from './features/home/pages/home/home';
import { Lists } from './features/lists/pages/lists/lists';
import { ViewList } from './features/lists/pages/view-list/view-list';
import { Quizes } from './features/quizes/pages/quizes/quizes';
import { CharacterQuiz } from './features/quizes/pages/character-quiz/character-quiz';

export const routes: Routes = [
  { path: 'writing/:type/:unicode', component: WritingPractice },
  { path: 'characters/picker', component: CharacterPicker },
  { path: 'characters/info/:type/:unicode', component: CharacterInfo },
  { path: 'lists', component: Lists },
  { path: 'lists/edit/:id', component: ViewList },
  { path: 'quizes', component: Quizes },
  { path: 'quizes/:mode/:listId', component: CharacterQuiz },
  { path: '', component: Home },
  { path: '**', redirectTo: '' },
];
