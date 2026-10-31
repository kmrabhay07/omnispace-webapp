import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(environment.apiUrl + '/') || req.url === environment.apiUrl;
  const token = isApi && auth.isLoggedIn() ? auth.currentUser()?.token : undefined;
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req).pipe(
    catchError(error => {
      if (isApi && error.status === 401) auth.logout();
      return throwError(() => error);
    })
  );
};
