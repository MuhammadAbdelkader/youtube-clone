import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppNotification {
  _id: string;
  type: 'like' | 'comment' | 'reply' | 'subscription' | 'new_video';
  isRead: boolean;
  createdAt: string;
  sender?: { _id: string; username: string; avatar_url?: string };
  video?: { _id: string; title: string; thumbnailUrl?: string };
  channel?: { _id: string; title: string; avatar?: string };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchUnreadCount(): void {
    this.http.get<{ success: boolean; count: number }>(`${this.base}/unread-count`)
      .subscribe({
        next: (res) => this.unreadCountSubject.next(res.count),
        error: () => {} // silently ignore if user is not logged in
      });
  }

  setUnreadCount(n: number): void {
    this.unreadCountSubject.next(n);
  }

  getNotifications(page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.base}?page=${page}&limit=${limit}`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        if (current > 0) this.unreadCountSubject.next(current - 1);
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.base}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }
}
