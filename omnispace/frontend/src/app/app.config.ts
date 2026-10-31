import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { routes } from './app.routes';
import { MotionService } from './core/services/motion.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }), withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: ({ transition }) => { if (!inject(MotionService).enabled()) transition.skipTransition(); } })),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};
