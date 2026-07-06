import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type LikeTargetType = 'video' | 'comment';
export type LikeType = 'like' | 'dislike';

@Injectable({
  providedIn: 'root',
})
export class LikeService {
  private apiUrl = `${environment.apiUrl}/likes`;

  constructor(private http: HttpClient) {}

  toggleLike(targetType: LikeTargetType, targetId: string, type: LikeType): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/toggle`,
      { targetType, targetId, type },
      { withCredentials: true }
    );
  }

  getLikeStatus(targetType: LikeTargetType, targetId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${targetType}/${targetId}`, { withCredentials: true });
  }
}
