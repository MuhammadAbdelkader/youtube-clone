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
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:3000/videos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({ token });
  }

  getAllVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // uploadVideo(data: FormData): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/upload`, data, { headers: this.getHeaders() });
  // }
}
