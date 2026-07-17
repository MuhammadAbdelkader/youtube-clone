import {
  Component, Input, Output, EventEmitter,
  HostListener, ElementRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { HistoryService } from '../../services/history.service';
import { VideoService } from '../../services/video.service';
import { Auth } from '../../services/auth';
import { VideoMenuStateService } from '../../services/video-menu-state.service';

@Component({
  selector: 'app-video-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-menu.html',
  styleUrl: './video-menu.css',
})
export class VideoMenuComponent implements OnInit, OnDestroy {
  @Input() video: any;
  @Input() showRemoveFromHistory = false;

  /** Emitted after successful delete so the parent list can remove the card instantly. */
  @Output() videoDeleted = new EventEmitter<string>();

  isOpen = false;
  removing = false;

  // ── Delete confirmation state ──────────────────────────────────────────────
  confirmingDelete = false;
  deleting = false;

  private menuSub!: Subscription;

  constructor(
    private readonly toastService: ToastService,
    private readonly historyService: HistoryService,
    private readonly videoService: VideoService,
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly eRef: ElementRef,
    private readonly menuState: VideoMenuStateService,
  ) {}

  ngOnInit(): void {
    // Subscribe to the global active menu id.
    // Whenever ANY other menu opens, this one will automatically close.
    this.menuSub = this.menuState.activeId$.subscribe(activeId => {
      const myId = this.video?._id || this.video?.videoId;
      if (activeId !== myId) {
        this.isOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.menuSub?.unsubscribe();
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  get isOwnVideo(): boolean {
    const currentUserId = this.auth.getCurrentUser()?.id;
    const ownerId =
      typeof this.video?.userId === 'object'
        ? this.video?.userId?._id
        : this.video?.userId;
    return !!currentUserId && !!ownerId && String(currentUserId) === String(ownerId);
  }

  // ── Menu toggle ────────────────────────────────────────────────────────────
  toggleMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const myId = this.video?._id || this.video?.videoId;

    if (this.isOpen) {
      // Already open — close it
      this.isOpen = false;
      this.menuState.closeAll();
    } else {
      // Tell the global state this menu is now open.
      // All other menus will close themselves via the subscription.
      this.isOpen = true;
      this.menuState.open(myId);
    }
  }

  // ── Share ──────────────────────────────────────────────────────────────────
  shareVideo(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = false;
    this.menuState.closeAll();

    const videoId = this.video?.videoId || this.video?._id;
    const url = `${window.location.origin}/watch?v=${videoId}`;

    navigator.clipboard.writeText(url).then(
      () => this.toastService.showSuccess('Link copied to clipboard'),
      () => this.toastService.showError('Failed to copy link'),
    );
  }

  // ── Remove from history ────────────────────────────────────────────────────
  removeFromHistory(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = false;
    this.menuState.closeAll();
    if (this.removing) return;

    const mongoId = this.video?._id;
    if (!mongoId) {
      this.toastService.showError('Unable to remove — video ID not found.');
      return;
    }

    this.removing = true;
    this.historyService.removeFromWatchHistory(mongoId).subscribe({
      next: () => {
        this.toastService.showSuccess('Removed from watch history');
        this.removing = false;
      },
      error: () => {
        this.toastService.showError('Failed to remove from history');
        this.removing = false;
      },
    });
  }

  // ── Delete flow ────────────────────────────────────────────────────────────
  requestDelete(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = false;
    this.menuState.closeAll();
    this.confirmingDelete = true;
  }

  cancelDelete(event?: Event): void {
    event?.stopPropagation();
    this.confirmingDelete = false;
  }

  confirmDelete(event: Event): void {
    event.stopPropagation();
    if (this.deleting) return;

    const id = this.video?._id;
    if (!id) {
      this.toastService.showError('Cannot delete — video ID missing.');
      return;
    }

    this.deleting = true;
    this.videoService.deleteVideo(id).subscribe({
      next: () => {
        this.toastService.showSuccess('Video deleted successfully.');
        this.confirmingDelete = false;
        this.deleting = false;
        this.videoDeleted.emit(id);
      },
      error: (err: any) => {
        this.toastService.showError(err?.error?.message || 'Failed to delete video.');
        this.deleting = false;
      },
    });
  }

  /** Close on outside click (keep for clicking empty page areas) */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      if (!this.confirmingDelete && this.isOpen) {
        this.isOpen = false;
        this.menuState.closeAll();
      }
    }
  }
}
