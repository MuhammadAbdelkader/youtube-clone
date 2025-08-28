import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:3000';
  private logoutTimer: any;
  constructor(private http: HttpClient) {}

  // ---------------- Register ----------------
  register(data: { username: string; email: string; password: string; avatar?: File }): Observable<any> {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('password', data.password);
    if (data.avatar) formData.append('avatar', data.avatar);
    console.log(data);

    return this.http.post(`${this.apiUrl}/signup`, data, {
      withCredentials: true // مهم عشان refreshToken ييجي في الكوكي
    });
  }
getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}
  // ---------------- Login ----------------
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data, { withCredentials: true })
    .pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.accessToken);

        // نحسب وقت الانتهاء (مثلاً 15 دقيقة)
        const expiresAt = Date.now() + (15 * 60 * 1000);
        localStorage.setItem('expiresAt', expiresAt.toString());

        this.startAutoLogoutTimer(15 * 60 * 1000); // شغل التايمر
      })
    );
  }

  // ---------------- Refresh Token ----------------
  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true });
  }

  // ---------------- Logout ----------------
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
    window.location.href = '/login';
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    window.location.href = '/login';
  }

  // ---------------- reset Password ----------------
  resetPassword(token: string, password: string) {
  return this.http.post(`${this.apiUrl}/reset-password/${token}`, { password }, {
    withCredentials: true
  });
}

isLoggedIn(): boolean {
  return !!localStorage.getItem('accessToken');
}


  // ---------------- Upload Video ----------------
  uploadVideo(data: FormData) {
    return this.http.post(`${this.apiUrl}/videos/upload`, data, {
      headers: {
        token: localStorage.getItem('accessToken') || ''
      },
      withCredentials: true
    });
  }

   // ---------------- Search Video ----------------
  searchVideos(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/videos/search?q=${query}`, {
      headers: {
        token: localStorage.getItem('accessToken') || '' // يبعت التوكن للباك
      },
      withCredentials: true
    });
  }

  getVideoById(id: string) {
  return this.http.get(`${this.apiUrl}/videos/${id}`, {
    headers: { token: localStorage.getItem('accessToken') || '' },
    withCredentials: true
  });
}

// ----------------log out Timer----------------
startAutoLogoutTimer(duration: number) {
  if (this.logoutTimer) clearTimeout(this.logoutTimer);

  this.logoutTimer = setTimeout(() => {
    this.logout();
  }, duration);
}

// ----------------Get All Channels----------------
getAllChannels() {
  return this.http.get(`${this.apiUrl}/channels`, {
    headers: { token: localStorage.getItem('accessToken') || '' },
    withCredentials: true
  });
}

}

