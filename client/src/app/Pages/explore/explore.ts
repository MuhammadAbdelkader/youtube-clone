import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryPipe],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit {
  videos: any[] = [];
  loading = true;
  error = '';

  constructor(private videoService: VideoService, private toast: ToastService) {}

  ngOnInit(): void {
    // In a real app we might fetch trending or categories, we'll reuse getTrendingVideos or getAllVideos
    this.videoService.getTrendingVideos().subscribe({
      next: (res: any) => {
        this.videos = res?.data || res?.videos || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load explore feed.';
        this.loading = false;
        // Toast is automatically shown by error interceptor
      }
    });
  }
}
