import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  duration: number;
  category: string;
  tags: string[];
  aiSummary?: string;
  aiTags?: string[];
  aiProcessed?: boolean;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  channel: {
    _id: string;
    title: string;
    avatar: string;
    subscribersCount: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private apiUrl = 'http://localhost:3000/api/videos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  getAllVideos(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getVideoById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getTrendingVideos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/trending`);
  }

  searchVideos(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  streamVideo(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stream/${id}`);
  }
}
