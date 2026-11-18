import { Routes } from '@angular/router';
import { WritingPractice } from './features/writing/components/writing-practice/writing-practice';
import { CharacterPicker } from './features/characters/pages/character-picker/character-picker';
import { CharacterInfo } from './features/characters/pages/character-info/character-info';
import { Home } from './features/home/pages/home/home';
import { Lists } from './features/lists/pages/lists/lists';
import { ViewList } from './features/lists/pages/view-list/view-list';
import { Quizes } from './features/quizes/pages/quizes/quizes';
import { CharacterQuiz } from './features/quizes/pages/character-quiz/character-quiz';
import { StrokesQuiz } from './features/quizes/pages/strokes-quiz/strokes-quiz';
import { Signup } from './core/auth/pages/signup/signup';
import { Login } from './core/auth/pages/login/login';
import { Profile } from './core/auth/pages/profile/profile';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { VerifyEmail } from './core/auth/pages/verify-email/verify-email';
import { ResetPassword } from './core/auth/pages/reset-password/reset-password';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { Logout } from './core/auth/pages/logout/logout';
import { QuizSessionDetails } from './features/quizes/pages/quiz-session-details/quiz-session-details';

export const routes: Routes = [
  { path: 'writing/:type/:unicode', component: WritingPractice },
  { path: 'characters/picker', component: CharacterPicker },
  { path: 'characters/info/:type/:unicode', component: CharacterInfo },
  { path: 'lists', component: Lists },
  { path: 'lists/edit/:id', component: ViewList },
  { path: 'quizzes/details/:sessionId', component: QuizSessionDetails },
  { path: 'quizzes/strokes/:mode/:listId', component: StrokesQuiz },
  { path: 'quizzes/:mode/:listId', component: CharacterQuiz },
  { path: 'quizzes', component: Quizes },
  { path: 'auth/signup', component: Signup, canActivate: [guestGuard] },
  { path: 'auth/login', component: Login, canActivate: [guestGuard] },
  { path: 'auth/logout', component: Logout },
  { path: 'auth/verify-email', component: VerifyEmail },
  { path: 'auth/reset-password', component: ResetPassword },
  { path: 'user/profile', component: Profile, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard },
  { path: '', component: Home },
  { path: '**', redirectTo: '' },
];
