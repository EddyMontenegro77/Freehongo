import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthService } from './shared/services/auth/auth.service';
import { SyncTriggerService } from './core/sync/services/sync-trigger.service';
import { credentialsInterceptor } from './core/http/credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const trigger = inject(SyncTriggerService);
      await auth.loadSession();
      trigger.start();
    }),
  ],
};
