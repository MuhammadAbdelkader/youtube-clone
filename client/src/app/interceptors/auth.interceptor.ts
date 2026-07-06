import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable, shareReplay, finalize } from 'rxjs';
import { Auth } from '../services/auth';

// Holds the ONE in-flight refresh call that every concurrent 401 shares, rather
// than a side BehaviorSubject that had to be manually told "it succeeded" or
// "it failed". That manual coordination was the bug: the failure path reset
// state and redirected, but never pushed anything to the subject, so any
// OTHER request queued behind it wound up filtering forever for a token that
// was never coming -- it hung permanently, with no error and no resolution,
// even though the user was already being redirected to /login.
//
// Sharing the actual refresh Observable instead means success AND failure
// both reach every waiting request through normal Observable next/error
// semantics -- there's no separate signal that can be forgotten.
let refreshInFlight$: Observable<any> | null = null;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(Auth);
  const router = inject(Router);

  let authReq = req;
  const token = authService.getAccessToken();

  // Attach the token for all /api requests, except refresh where we rely on httpOnly cookies
  if (token && req.url.includes('/api/') && !req.url.includes('/auth/refresh')) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Intercept 401 Unauthorized errors (excluding refresh/logout endpoints to avoid loops)
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/logout')
      ) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<any>, token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: Auth, router: Router) {
  if (!refreshInFlight$) {
    // shareReplay(1) multicasts this single call (success OR error) to every
    // request that joins while it's in flight. finalize() clears the
    // reference once it settles so the NEXT independent 401 -- possibly much
    // later -- starts a fresh refresh instead of replaying a stale result.
    refreshInFlight$ = authService.refreshToken().pipe(
      finalize(() => { refreshInFlight$ = null; }),
      shareReplay(1)
    );
  }

  return refreshInFlight$.pipe(
    switchMap((res: any) => next(addTokenHeader(request, res.accessToken))),
    catchError((err) => {
      // The refresh token itself is expired or invalid. Clear local session
      // state and send the user to login via the Router rather than a full
      // page reload -- window.location.href throws away the whole SPA and
      // re-downloads the entire bundle right when the UX should be smoothest.
      authService.clearSession();
      router.navigate(['/login']);
      return throwError(() => err);
    })
  );
}
