import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';
import { DurationPipe } from '../../pipes/duration.pipe';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { VideoMenuComponent } from '../../components/video-menu/video-menu';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryPipe, DurationPipe, AvatarComponent, VideoMenuComponent],
  templateUrl: './main.html',
  styleUrl: './main.css'
})
export class Main implements OnInit {
  videos: any[] = [];
  loading = true;
  error = '';

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.getAllVideos().subscribe({
      next: (res: any) => {
        this.videos = res?.data || res?.videos || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load videos.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
