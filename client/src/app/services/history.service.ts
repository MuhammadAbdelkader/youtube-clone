import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface WatchHistoryItem {
  _id: string;
  video: any;
  watchedAt: string;
  watchDuration: number;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private apiUrl = `${environment.apiUrl}/history`;
  private historySubject = new BehaviorSubject<WatchHistoryItem[]>([]);
  public history$ = this.historySubject.asObservable();

  constructor(private http: HttpClient) {}

  getHistory(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(res => {
        if (res.status === 'success') {
          this.historySubject.next(res.data);
        }
      })
    );
  }

  addToWatchHistory(videoId: string, watchDuration: number = 0, completed: boolean = false): Observable<any> {
    return this.http.post<any>(this.apiUrl, { videoId, watchDuration, completed }).pipe(
      catchError(err => of(null)) // fail silently for tracking
    );
  }

  removeFromWatchHistory(videoId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${videoId}`).pipe(
      tap(() => {
        const current = this.historySubject.value;
        this.historySubject.next(current.filter(item => item.video?._id !== videoId && item.video?.videoId !== videoId));
      })
    );
  }

  clearWatchHistory(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear`).pipe(
      tap(() => this.historySubject.next([]))
    );
  }
}
