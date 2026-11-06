import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // Clear invalid/stale/expired tokens on 401 Unauthorized to stop infinite retry loops
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        !req.url.includes('/api/auth/login')
      ) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
