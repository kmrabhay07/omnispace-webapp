import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(environment.apiUrl + '/') || req.url === environment.apiUrl;
  const credentialsRequest = ['/auth/login', '/auth/register'].some(path => req.url.split('?')[0] === environment.apiUrl + path);
  const token = isApi && !credentialsRequest && auth.isLoggedIn() ? auth.currentUser()?.token : undefined;
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req).pipe(
    catchError(error => {
      // A delayed response from an older session must not clear a newer login.
      if (isApi && error.status === 401 && token && auth.currentUser()?.token === token) auth.logout();
      return throwError(() => error);
    })
  );
};
