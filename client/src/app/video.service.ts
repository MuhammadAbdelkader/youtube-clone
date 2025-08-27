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

  // 👇 static token
  private headers = new HttpHeaders({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFjYTBkNzI1NWNlZGJkOWRlMDgxZGYiLCJpYXQiOjE3NTYyMzU1NjgsImV4cCI6MTc1NjIzNjQ2OH0.Ri9nPxaWjTFbNMnYHqR7M_lZN5c33u_eVANcv2go7Bc"
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
