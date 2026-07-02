import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Avoid showing toasts for silent auth/refresh errors as they are handled by auth.interceptor
      if (req.url.includes('/auth/refresh') || error.status === 401) {
        return throwError(() => error);
      }

      let errorMsg = 'An unexpected error occurred.';
      if (error.error && error.error.message) {
        errorMsg = error.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      // Sanitize internal token errors
      if (errorMsg.toLowerCase().includes('token')) {
        errorMsg = 'Session issue detected. Please check your login status.';
      }

      toastService.showError(errorMsg);

      return throwError(() => error);
    })
  );
};
