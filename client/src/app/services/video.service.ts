import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

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
  private apiUrl = `${environment.apiUrl}/videos`;

  constructor(private http: HttpClient) {}


  getAllVideos(page = 1, limit = 10): Observable<ApiResponse<Video[]>> {
    return this.http.get<ApiResponse<Video[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getVideoById(id: string): Observable<ApiResponse<Video>> {
    return this.http.get<ApiResponse<Video>>(`${this.apiUrl}/${id}`);
  }

  getTrendingVideos(): Observable<ApiResponse<Video[]>> {
    return this.http.get<ApiResponse<Video[]>>(`${this.apiUrl}/trending`);
  }

  searchVideos(query: string): Observable<ApiResponse<Video[]>> {
    return this.http.get<ApiResponse<Video[]>>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  streamVideo(id: string): Observable<any> {
    // This is called in the background solely to increment the view count
    return this.http.post(`${this.apiUrl}/view/${id}`, {});
  }
}
