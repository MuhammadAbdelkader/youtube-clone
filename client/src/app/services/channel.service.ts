import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Channel {
  _id: string;
  title: string;
  description: string;
  avatar: string;
  coverImage: string;
  owner: { _id: string; username: string } | string;
  videos: any[];
  subscribersCount: number;
  totalViews: number;
  isVerified: boolean;
  category: string;
  socialLinks?: { website?: string; twitter?: string; instagram?: string };
}

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private apiUrl = `${environment.apiUrl}/channels`;

  constructor(private http: HttpClient) {}

  getChannelById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /** The logged-in user's own channel, if they have one. 404s if not. */
  getMyChannel(): Observable<any> {
    return this.http.get(`${this.apiUrl}/myChannel`, { withCredentials: true });
  }

  searchChannels(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  createChannel(data: { title: string; description: string; category?: string }): Observable<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    return this.http.post(this.apiUrl, formData, { withCredentials: true });
  }

  updateChannel(id: string, data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }
}
