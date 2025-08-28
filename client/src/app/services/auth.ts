import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // ---------------- Register ----------------
  register(data: { username: string; email: string; password: string; avatar?: File }): Observable<any> {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('password', data.password);
    if (data.avatar) formData.append('avatar', data.avatar);

    return this.http.post(`${this.apiUrl}/signup`, formData, {
      withCredentials: true // مهم عشان refreshToken ييجي في الكوكي
    });
  }

  // ---------------- Login ----------------
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data, {
      withCredentials: true // refreshToken يتخزن في الكوكي
    });
  }

  // ---------------- Refresh Token ----------------
  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true });
  }

  // ---------------- Logout ----------------
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // ---------------- Get Current User ----------------
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
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
}

