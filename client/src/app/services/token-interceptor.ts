// في ملف auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api'; // غير الـ URL حسب السيرفر بتاعك
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  // Refresh Token Method
  refreshToken(): Observable<any> {
    // مش محتاج نبعت حاجة في الـ body لأن التوكن في الـ cookies
    return this.http.post(`${this.apiUrl}/auth/refresh`, {}, {
      withCredentials: true // مهم جداً عشان يبعت الـ cookies
    }).pipe(
      tap((response: any) => {
        // حفظ التوكن الجديد (الـ refresh token باقي في الـ cookies)
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
          this.tokenSubject.next(response.accessToken);
        }
      }),
      catchError((error) => {
        // إذا الـ refresh token expired، ارجع للـ login
        this.logout();
        throw error;
      })
    );
  }

  // Auto Refresh Token قبل ما ينتهي
  autoRefreshToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // فك تشفير التوكن عشان نشوف امتى ينتهي
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // تحويل لـ milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiry - now;

      // لو باقي 5 دقايق على انتهاء التوكن، refresh
      if (timeUntilExpiry < 5 * 60 * 1000) {
        this.refreshToken().subscribe({
          next: () => console.log('Token refreshed automatically'),
          error: (err) => console.error('Auto refresh failed:', err)
        });
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  // Manual Refresh - للاستخدام اليدوي
  manualRefresh(): Observable<any> {
    return this.refreshToken();
  }

  // Logout
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    this.tokenSubject.next(null);

    // مسح الـ refresh token من الـ cookies
    this.http.post(`${this.apiUrl}/auth/logout`, {}, {
      withCredentials: true
    }).subscribe();

    // redirect to login page
    // this.router.navigate(['/login']);
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() >= expiry;
    } catch {
      return true;
    }
  }
}
