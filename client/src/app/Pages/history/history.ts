import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  HistoryService,
  WatchHistoryItem,
} from '../../services/history.service';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { VideoMenuComponent } from '../../components/video-menu/video-menu';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CloudinaryPipe,
    AvatarComponent,
    VideoMenuComponent,
    DurationPipe,
  ],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class HistoryComponent implements OnInit, OnDestroy {
  historyItems: WatchHistoryItem[] = [];
  loading = true;
  error: string | null = null;

  /** Controls the inline "are you sure?" confirmation banner for clear-all */
  showClearConfirm = false;
  clearing = false;

  /** TearDown signal — all subscriptions call takeUntil(this.destroy$) */
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly historyService: HistoryService) {}

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Subscribe to the reactive state streams
    this.historyService.history$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => (this.historyItems = items));

    this.historyService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoading) => (this.loading = isLoading));

    this.historyService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((err) => (this.error = err));

    // Trigger the network fetch (skips if already cached)
    this.historyService.getHistory().pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Actions ────────────────────────────────────────────────────────────

  /** Open the inline confirmation banner instead of blocking confirm() */
  requestClear(): void {
    this.showClearConfirm = true;
  }

  /** User cancelled — dismiss the confirmation banner */
  cancelClear(): void {
    this.showClearConfirm = false;
  }

  /** User confirmed — perform the delete and dismiss banner */
  confirmClear(): void {
    if (this.clearing) return;
    this.clearing = true;
    this.showClearConfirm = false;

    this.historyService
      .clearWatchHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => (this.clearing = false),
        error: () => (this.clearing = false),
      });
  }

  /** Force a fresh server fetch (pull-to-refresh / retry after error) */
  refresh(): void {
    this.historyService.getHistory(true).pipe(takeUntil(this.destroy$)).subscribe();
  }

  /**
   * Returns the progress percentage for the progress bar.
   * Clamps between 0 and 100 and guards against division by zero.
   */
  watchProgress(item: WatchHistoryItem): number {
    if (item.completed) return 100;
    const duration = item.video?.duration;
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.round((item.watchDuration / duration) * 100));
  }

  /**
   * Builds the correct routerLink params for a history item.
   * Prefers the human-readable videoId (Cloudinary slug) for the ?v= param,
   * falls back to the MongoDB _id if videoId is absent.
   */
  videoQueryParams(item: WatchHistoryItem): { v: string } {
    return { v: item.video?.videoId || item.video?._id };
  }
}
