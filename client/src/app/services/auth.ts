import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface UserData {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  avatar?: string;
  channelId?: string;
  isEmailVerified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'http://localhost:3000/api/auth';

  private currentUser = new BehaviorSubject<UserData | null>(this._loadUser());

  /** Observable stream of the current user */
  currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient) {}

  // ─── Token Helpers ───────────────────────────────────────────────────────

  // ─── Token Helpers ───────────────────────────────────────────────────────

  private _loadUser(): UserData | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private _storeSession(accessToken: string, user: UserData): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.next(user);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // ─── Register (Step 1 — sends OTP) ───────────────────────────────────────

  register(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data, {
      withCredentials: true,
    });
  }

  // ─── Verify Email (Step 2 — confirms OTP) ────────────────────────────────

  verifyEmail(email: string, otp: string): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/verify-email`,
        { email, otp },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          if (res.accessToken && res.user) {
            this._storeSession(res.accessToken, res.user);
          }
        })
      );
  }

  // ─── Resend Verification OTP ──────────────────────────────────────────────

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  login(data: { email: string; password: string }): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, data, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.accessToken && res.user) {
            this._storeSession(res.accessToken, res.user);
          }
        })
      );
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  googleAuth(credential: string): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/google`,
        { credential },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          if (res.accessToken && res.user) {
            this._storeSession(res.accessToken, res.user);
          }
        })
      );
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  refreshToken(): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.accessToken) {
            localStorage.setItem('accessToken', res.accessToken);
          }
        })
      );
  }

  // ─── Password Reset Flow ──────────────────────────────────────────────────

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, otp: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      email,
      otp,
      password,
    });
  }

  // ─── Get Current User ─────────────────────────────────────────────────────

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, {
      withCredentials: true,
    });
  }

  // ─── Update Profile ───────────────────────────────────────────────────────

  updateProfile(data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update-profile`, data, {
      withCredentials: true,
      reportProgress: true,
      observe: 'events',
    });
  }

  // ─── Upload Video ─────────────────────────────────────────────────────────

  uploadVideo(data: FormData): Observable<any> {
    return this.http.post('http://localhost:3000/api/videos/upload', data, {
      withCredentials: true,
    });
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  logout(): void {
    this.http
      .post(
        `${this.apiUrl}/logout`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        complete: () => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          this.currentUser.next(null);
          window.location.href = '/login';
        },
        error: () => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          this.currentUser.next(null);
          window.location.href = '/login';
        },
      });
  }

  // ─── Get Current User (sync, from localStorage) ──────────────────────────

  getCurrentUser(): UserData | null {
    return this.currentUser.value;
  }

  // ─── Update Current User Session (reactive push) ─────────────────────────
  /**
   * Persists the updated user to localStorage and pushes it into the
   * currentUser$ stream so all subscribers (Navbar, etc.) react immediately.
   */
  updateCurrentUser(user: UserData): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.next(user);
  }
}
