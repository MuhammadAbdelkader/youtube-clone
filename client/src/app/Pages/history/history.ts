import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HistoryService, WatchHistoryItem } from '../../services/history.service';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { VideoMenuComponent } from '../../components/video-menu/video-menu';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryPipe, AvatarComponent, VideoMenuComponent, DurationPipe],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class HistoryComponent implements OnInit {
  historyItems: WatchHistoryItem[] = [];
  loading = true;

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.historyService.history$.subscribe(items => {
      this.historyItems = items;
    });

    this.historyService.getHistory().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  clearHistory(): void {
    if (confirm('Are you sure you want to clear your watch history?')) {
      this.historyService.clearWatchHistory().subscribe();
    }
  }
}
