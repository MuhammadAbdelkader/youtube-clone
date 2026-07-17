import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  videoId: string;
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
  /** The uploader — can be a populated object or a bare ObjectId string. */
  userId?: string | { _id: string };
  createdAt?: string;
  channel: {
    _id: string;
    title: string;
    avatar: string;
    subscribersCount: number;
    isVerified?: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private readonly apiUrl = `${environment.apiUrl}/videos`;

  constructor(private readonly http: HttpClient) {}

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
    return this.http.get<ApiResponse<Video[]>>(
      `${this.apiUrl}/search?q=${encodeURIComponent(query)}`
    );
  }

  streamVideo(id: string): Observable<unknown> {
    // Called in the background solely to increment the server-side view count.
    return this.http.post(`${this.apiUrl}/view/${id}`, {});
  }

  /**
   * Permanently deletes the video identified by `id`.
   * The backend verifies that the authenticated user is the uploader;
   * non-owners receive a 404 (not a 403) to prevent information leakage.
   */
  deleteVideo(id: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );
  }
}
