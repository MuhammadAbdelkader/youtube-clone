import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

uploadVideo(data: FormData) {
  return this.http.post(`${this.apiUrl}/videos/upload`, data, {
    headers: {
      token: localStorage.getItem('accessToken') || ''
    }
  });
}



}
