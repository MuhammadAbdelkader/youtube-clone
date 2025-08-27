import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  register(data: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, data);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }
  updateProfile(data: any) {
  const formData = new FormData();
  formData.append('username', data.username);
  formData.append('email', data.email);
  if (data.password) formData.append('password', data.password);
  if (data.avatar) formData.append('avatar', data.avatar);

  return this.http.put(`${this.apiUrl}/update-profile`, formData);
}
logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('avatar_url');
  window.location.href = '/login'; // Redirect to login page
}

getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}
// refresh Token
refreshToken() {
  return this.http.post(
    `${this.apiUrl}/refresh`,
    {}, // مفيش body
    { withCredentials: true } // مهم عشان الكوكي يتبعت
  );
}




uploadVideo(data: FormData) {
  return this.http.post(`${this.apiUrl}/videos/upload`, data, {
  headers: {
    token: localStorage.getItem('accessToken') || ''
  }
});
}


}




