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

  private headers = new HttpHeaders({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFjYTBkNzI1NWNlZGJkOWRlMDgxZGYiLCJpYXQiOjE3NTYzMjA1MDEsImV4cCI6MTc1NjMyMTQwMX0.JIw3C3upnem6Q_7oG3NZqbtsU660CUNS8SWKyiDxRRo"
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
}
