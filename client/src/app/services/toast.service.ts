import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);

  toast$: Observable<ToastMessage | null> = this.toastSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) {
    this.toastSubject.next({ message, type, duration });
    
    if (duration > 0) {
      setTimeout(() => {
        this.clearToast();
      }, duration);
    }
  }

  showError(message: string) {
    this.showToast(message, 'error');
  }

  showSuccess(message: string) {
    this.showToast(message, 'success');
  }

  clearToast() {
    this.toastSubject.next(null);
  }
}
