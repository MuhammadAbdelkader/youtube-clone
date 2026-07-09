import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { Auth } from './services/auth';
import { ConfigService } from './services/config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Runs Auth.bootstrap() and ConfigService.load() in parallel before
    // the first component renders. Both are fire-and-forget on failure —
    // a missing refresh cookie (Auth) or an unreachable config endpoint
    // are both normal degraded states, not hard errors.
    provideAppInitializer(() => inject(Auth).bootstrap()),
    provideAppInitializer(() => inject(ConfigService).load()),
  ]
};
