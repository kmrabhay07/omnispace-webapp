import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const rawUser = localStorage.getItem('omni_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user && user.token && !user.token.startsWith('mock-') && user.token.length > 25) {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${user.token}`
          }
        });
        return next(cloned);
      }
    }
  } catch (e) {
    console.error('Error attaching auth token to request', e);
  }
  return next(req);
};
