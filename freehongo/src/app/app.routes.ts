import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: 'writing/:type/:unicode',
    loadComponent: () => import('./features/writing/components/writing-practice/writing-practice').then((m) => m.WritingPractice),
  },
  {
    path: 'characters/picker',
    loadComponent: () => import('./features/characters/pages/character-picker/character-picker').then((m) => m.CharacterPicker),
  },
  {
    path: 'characters/info/:type/:unicode',
    loadComponent: () => import('./features/characters/pages/character-info/character-info').then((m) => m.CharacterInfo),
  },
  {
    path: 'lists',
    loadComponent: () => import('./features/lists/pages/lists/lists').then((m) => m.Lists),
  },
  {
    path: 'lists/edit/:id',
    loadComponent: () => import('./features/lists/pages/view-list/view-list').then((m) => m.ViewList),
  },
  {
    path: 'quizzes/details/:sessionId',
    loadComponent: () => import('./features/quizes/pages/quiz-session-details/quiz-session-details').then((m) => m.QuizSessionDetails),
  },
  {
    path: 'quizzes/strokes/:mode/:listId',
    loadComponent: () => import('./features/quizes/pages/strokes-quiz/strokes-quiz').then((m) => m.StrokesQuiz),
  },
  {
    path: 'quizzes/:mode/:listId',
    loadComponent: () => import('./features/quizes/pages/character-quiz/character-quiz').then((m) => m.CharacterQuiz),
  },
  {
    path: 'quizzes',
    loadComponent: () => import('./features/quizes/pages/quizes/quizes').then((m) => m.Quizes),
  },
  {
    path: 'auth/signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./core/auth/pages/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./core/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/logout',
    loadComponent: () => import('./core/auth/pages/logout/logout').then((m) => m.Logout),
  },
  {
    path: 'auth/verify-email',
    loadComponent: () => import('./core/auth/pages/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./core/auth/pages/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'user/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./core/auth/pages/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'docs/styles',
    loadComponent: () => import('./core/pages/styles-test/styles-test').then((m) => m.StylesTest),
  },
  {
    path: 'docs/legal/terms-and-conditions',
    loadComponent: () => import('./core/docs/legal/terms-and-conditions/terms-and-conditions').then((m) => m.TermsAndConditions),
  },
  {
    path: 'docs/legal/privacy-policy',
    loadComponent: () => import('./core/docs/legal/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: 'docs/legal/credits-and-licences',
    loadComponent: () => import('./core/docs/legal/credits-and-licenses/credits-and-licenses').then((m) => m.CreditsAndLicenses),
  },
  {
    path: 'docs/index',
    loadComponent: () => import('./core/docs/docs-index/docs-index').then((m) => m.DocsIndex),
  },
  {
    path: 'docs',
    loadComponent: () => import('./core/docs/docs-index/docs-index').then((m) => m.DocsIndex),
  },
  { path: '', component: Home },
  { path: '**', redirectTo: '' },
];
