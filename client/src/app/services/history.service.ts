import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { tap, catchError, takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ─── Typed Interfaces ────────────────────────────────────────────────────────

export interface WatchHistoryChannel {
  _id: string;
  title: string;
  avatar: string;
  handle?: string;
}

export interface WatchHistoryVideo {
  _id: string;
  videoId: string;        // Cloudinary public ID — used for /watch?v= routing
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: number;       // seconds
  views: number;
  channel: WatchHistoryChannel;
  isPublic: boolean;
}

export interface WatchHistoryItem {
  _id: string;
  video: WatchHistoryVideo;
  watchedAt: string;      // ISO-8601 string
  watchDuration: number;  // seconds watched
  completed: boolean;
}

export interface WatchHistoryResponse {
  status: 'success' | 'error';
  data: WatchHistoryItem[];
  pagination: { page: number; limit: number; total: number };
  fromCache: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  /** ⚠️  CRITICAL FIX: was `/history` — server registers at `/watch-history` */
  private readonly apiUrl = `${environment.apiUrl}/watch-history`;

  private readonly _history$ = new BehaviorSubject<WatchHistoryItem[]>([]);
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$   = new BehaviorSubject<string | null>(null);

  /** Current watch-history items as a reactive stream. */
  readonly history$ = this._history$.asObservable();

  /** Loading state stream (useful for skeleton loaders). */
  readonly loading$ = this._loading$.asObservable();

  /** Last error message, or null when healthy. */
  readonly error$ = this._error$.asObservable();

  /** True once a successful fetch has been made — prevents redundant re-fetches. */
  private hasLoaded = false;

  constructor(private readonly http: HttpClient) {}

  // ─── Read ────────────────────────────────────────────────────────────────

  /**
   * Fetch the user's watch history.
   * On success updates the shared `history$` stream.
   * On error resets the stream to [] and sets `error$`.
   * Pass `force = true` to bypass the loaded-cache and always re-fetch.
   */
  getHistory(force = false): Observable<WatchHistoryResponse> {
    if (this.hasLoaded && !force) {
      // Already have data — return current state without a network call
      return of({
        status: 'success' as const,
        data: this._history$.value,
        pagination: { page: 1, limit: 20, total: this._history$.value.length },
        fromCache: true,
      });
    }

    this._loading$.next(true);
    this._error$.next(null);

    return this.http.get<WatchHistoryResponse>(this.apiUrl).pipe(
      tap((res) => {
        if (res.status === 'success') {
          this._history$.next(res.data ?? []);
          this.hasLoaded = true;
        }
        this._loading$.next(false);
      }),
      catchError((err) => {
        this._history$.next([]);
        this._error$.next('Failed to load watch history. Please try again.');
        this._loading$.next(false);
        this.hasLoaded = false;
        // Re-throw so the component's error handler also fires
        throw err;
      }),
    );
  }

  // ─── Write ───────────────────────────────────────────────────────────────

  /**
   * Record a view of `videoId` (MongoDB _id).
   * Fails silently — watch tracking must never interrupt playback.
   */
  addToWatchHistory(
    videoId: string,
    watchDuration = 0,
    completed = false,
  ): Observable<any> {
    return this.http
      .post<any>(this.apiUrl, { videoId, watchDuration, completed })
      .pipe(
        tap(() => {
          // Invalidate local cache so next visit re-fetches fresh data
          this.hasLoaded = false;
        }),
        catchError(() => of(null)), // fail silently — non-critical tracking call
      );
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  /**
   * Remove all history entries for a video.
   * `videoId` is the MongoDB _id of the video document (not the Cloudinary videoId).
   */
  removeFromWatchHistory(videoId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${videoId}`).pipe(
      tap(() => {
        // Optimistically remove from local state
        const updated = this._history$.value.filter(
          (item) => item.video?._id !== videoId,
        );
        this._history$.next(updated);
        // Invalidate hasLoaded so a manual re-fetch gets the server state
        this.hasLoaded = false;
      }),
    );
  }

  /** Remove all entries for the current user. */
  clearWatchHistory(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear`).pipe(
      tap(() => {
        this._history$.next([]);
        this.hasLoaded = false;
      }),
    );
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  /** Reset all state — call on logout to avoid stale data leaking across sessions. */
  resetState(): void {
    this._history$.next([]);
    this._loading$.next(false);
    this._error$.next(null);
    this.hasLoaded = false;
  }
}
