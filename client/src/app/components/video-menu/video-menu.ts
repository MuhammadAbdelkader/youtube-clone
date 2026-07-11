import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { HistoryService } from '../../services/history.service';

@Component({
  selector: 'app-video-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-menu.html',
  styleUrl: './video-menu.css'
})
export class VideoMenuComponent {
  @Input() video: any;
  @Input() showRemoveFromHistory = false;

  isOpen = false;

  constructor(
    private toastService: ToastService,
    private historyService: HistoryService
  ) {}

  toggleMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = !this.isOpen;
  }

  shareVideo(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = false;
    
    // Construct the URL to the video
    const videoId = this.video.videoId || this.video._id;
    const url = `${window.location.origin}/watch?v=${videoId}`;
    
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showSuccess('Link copied to clipboard');
    }).catch(() => {
      this.toastService.showError('Failed to copy link');
    });
  }

  removeFromHistory(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen = false;
    
    const videoId = this.video.videoId || this.video._id;
    this.historyService.removeFromWatchHistory(videoId).subscribe(() => {
      this.toastService.showSuccess('Removed from watch history');
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isOpen = false;
  }
}
