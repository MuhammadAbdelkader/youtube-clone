import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  private token = localStorage.getItem('accessToken');

  private headers = new HttpHeaders({
    token: this.token || ''
  });

  constructor(private http: HttpClient) {}

  getVideoById(id: string): Observable<Video | null> {
    return this.http
      .get<{ status: boolean; data: Video[] }>(this.apiUrl, { headers: this.headers })
      .pipe(
        map(response => response.data.find(video => video._id === id) || null)
      );
  }

  getAllVideos(): Observable<Video[]> {
    return this.http
      .get<{ status: boolean; data: Video[] }>(this.apiUrl, { headers: this.headers })
      .pipe(map(response => response.data));
  }
  searchVideos(query: string, date?: string): Observable<any> {
    let url = `${this.apiUrl}/search?q=${query}`;
    if (date) {
      url += `&date=${date}`;
    }
    return this.http.get(url);
  }
}
