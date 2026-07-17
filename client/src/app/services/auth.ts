import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserData {
  id: string;
  name?: string;
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
  private apiUrl = `${environment.apiUrl}/auth`;

  // The access token lives ONLY here, in memory -- never in localStorage or
  // any other Web Storage. Anything an XSS-injected script can read (which
  // includes localStorage) is a token an attacker can exfiltrate; keeping it
  // as a plain JS variable means it's only reachable by code running in this
  // exact page load, and it disappears on tab close/reload by design. The
  // trade-off is that a hard reload loses it -- bootstrap() below is what
  // reacquires a fresh one via the httpOnly refresh cookie, which DOES
  // survive a reload (and isn't readable by JS at all, XSS included).
  private accessTokenValue: string | null = null;

  // The user's basic profile (username/avatar/email) isn't sensitive the same
  // way a bearer token is, so it's fine to cache in localStorage purely so
  // the UI has something to show immediately on load, before bootstrap()'s
  // silent refresh has resolved.
  private currentUser = new BehaviorSubject<UserData | null>(this._loadUser());

  /** Observable stream of the current user */
  currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Bootstrap (called once at app startup, see app.config.ts) ───────────

  /**
   * Runs before the app finishes bootstrapping (wired up via
   * provideAppInitializer in app.config.ts). If a previous session left a
   * cached user profile behind, attempts to silently reacquire a fresh
   * access token using the httpOnly refresh cookie, then re-fetches the
   * canonical profile. An expired/missing refresh cookie is a completely
   * normal outcome here (it just means "not logged in anymore"), not an
   * error -- it's swallowed and treated as a clean logged-out state.
   */
  async bootstrap(): Promise<void> {
    const hadPersistedSession = !!localStorage.getItem('user');
    if (!hadPersistedSession) return;

    try {
      await firstValueFrom(this.refreshToken());
      const res: any = await firstValueFrom(this.getMe());
      if (res?.data) {
        this._persistUser(res.data);
      } else {
        this.clearSession();
      }
    } catch {
      this.clearSession();
    }
  }

  // ─── Token / Session Helpers ──────────────────────────────────────────────

  private _loadUser(): UserData | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private _persistUser(user: UserData): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.next(user);
  }

  private _storeSession(accessToken: string, user: UserData): void {
    this.accessTokenValue = accessToken;
    this._persistUser(user);
  }

  /**
   * Clears local session state without making a network call or navigating --
   * used by the auth interceptor when a refresh fails, and by logout() below.
   */
  clearSession(): void {
    this.accessTokenValue = null;
    localStorage.removeItem('user');
    this.currentUser.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.accessTokenValue;
  }

  getAccessToken(): string | null {
    return this.accessTokenValue;
  }

  // ─── Register (Step 1 — sends OTP) ───────────────────────────────────────

  register(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<{ status: string; message: string; email: string }> {
    return this.http.post<{ status: string; message: string; email: string }>(`${this.apiUrl}/register`, data, {
      withCredentials: true,
    });
  }

  // ─── Verify Email (Step 2 — confirms OTP) ────────────────────────────────

  verifyEmail(email: string, otp: string): Observable<{ status: string; message: string; accessToken: string; user: UserData }> {
    return this.http
      .post<{ status: string; message: string; accessToken: string; user: UserData }>(
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

  resendVerification(email: string): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/resend-verification`, { email });
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  login(data: { email: string; password: string }): Observable<{ status: string; message: string; accessToken: string; user: UserData }> {
    return this.http
      .post<{ status: string; message: string; accessToken: string; user: UserData }>(`${this.apiUrl}/login`, data, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.accessToken && res.user) {
            this._storeSession(res.accessToken, res.user);
          }
        })
      );
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  googleAuth(credential: string): Observable<{ status: string; message: string; accessToken: string; user: UserData }> {
    return this.http
      .post<{ status: string; message: string; accessToken: string; user: UserData }>(
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

  refreshToken(): Observable<{ status: string; accessToken: string }> {
    return this.http
      .post<{ status: string; accessToken: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          if (res.accessToken) {
            this.accessTokenValue = res.accessToken;
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
  // NOTE: lives here rather than on VideoService for historical reasons --
  // if you're touching this file again, it belongs on VideoService instead.

  uploadVideo(data: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/videos/upload`, data, {
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
          this.clearSession();
          this.router.navigate(['/login']);
        },
        error: () => {
          this.clearSession();
          this.router.navigate(['/login']);
        },
      });
  }

  // ─── Get Current User (sync) ──────────────────────────────────────────────

  getCurrentUser(): UserData | null {
    return this.currentUser.value;
  }

  // ─── Update Current User Session (reactive push) ─────────────────────────
  /**
   * Persists the updated user to localStorage and pushes it into the
   * currentUser$ stream so all subscribers (Navbar, etc.) react immediately.
   */
  updateCurrentUser(user: UserData): void {
    this._persistUser(user);
  }
}
