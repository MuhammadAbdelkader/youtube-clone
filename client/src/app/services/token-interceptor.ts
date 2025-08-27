import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Auth } from './auth';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private auth: Auth, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // نضيف الـ accessToken لو موجود
    let authReq = req;
    const token = localStorage.getItem('accessToken');

    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
        withCredentials: true // عشان الكوكي اللي فيها refreshToken
      });
    } else {
      authReq = req.clone({ withCredentials: true });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // لو الاكسس توكن انتهى
        if (error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;

          return this.auth.refreshToken().pipe(
            switchMap((res: any) => {
              this.isRefreshing = false;

              // خزن الاكسس الجديد
              localStorage.setItem('accessToken', res.accessToken);

              // عيد نفس الريكوست بالـ token الجديد
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
                withCredentials: true
              });
              return next.handle(newReq);
            }),
            catchError((err) => {
              this.isRefreshing = false;
              this.auth.logout(); // امسح كل حاجة
              this.router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }
}
