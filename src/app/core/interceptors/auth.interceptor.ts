// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const addToken = (r: HttpRequest<unknown>, token: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  const token = auth.getAccessToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // اگه 401 بود و این درخواست خودِ refresh نیست
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
        return handleRefresh(req, next, auth, router, addToken);
      }
      return throwError(() => err);
    }),
  );
};

function handleRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
  addToken: (r: HttpRequest<unknown>, t: string) => HttpRequest<unknown>,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    return auth.refreshTokens().pipe(
      switchMap((tokens) => {
        isRefreshing = false;
        refreshSubject.next(tokens.accessToken);
        return next(addToken(req, tokens.accessToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshSubject.next(null);
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }),
    );
  }

  // درخواست‌های موازی صبر می‌کنند تا توکن جدید بیاد
  return refreshSubject.pipe(
    filter(t => t !== null),
    take(1),
    switchMap(token => next(addToken(req, token!))),
  );
}
