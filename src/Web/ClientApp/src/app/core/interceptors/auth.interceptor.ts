import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const currentUser = authService.currentUser();

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  if (currentUser?.agencyId) {
    headers = headers.set('X-Agency-Id', currentUser.agencyId);
  }

  const authReq = req.clone({ headers });

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // Clear token only when auth token verification explicitly fails on /api/auth/me
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        req.url.includes('/api/auth/me')
      ) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
