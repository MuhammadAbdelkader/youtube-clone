import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Singleton service that tracks which video-menu is currently open.
 * Only one menu can be open at a time across the entire app.
 */
@Injectable({ providedIn: 'root' })
export class VideoMenuStateService {
  /** The video _id of the currently open menu, or null when all closed. */
  private activeMenuId$ = new BehaviorSubject<string | null>(null);

  /** Open the menu for a specific video. Closes any previously open menu. */
  open(videoId: string): void {
    this.activeMenuId$.next(videoId);
  }

  /** Close all menus. */
  closeAll(): void {
    this.activeMenuId$.next(null);
  }

  /** Returns the observable so components can subscribe. */
  get activeId$() {
    return this.activeMenuId$.asObservable();
  }

  /** Snapshot of the currently open menu id. */
  get activeId(): string | null {
    return this.activeMenuId$.getValue();
  }
}
