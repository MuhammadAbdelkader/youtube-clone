import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { VideoService } from '../../services/video.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-video-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './video-details.html',
  styleUrl: './video-details.css'
})
export class VideoDetails implements OnInit {
  video: any = null;
  relatedVideos: any[] = [];
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    // Fetch the video by ID from the route param
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id');
          return id ? this.videoService.getVideoById(id) : [];
        })
      )
      .subscribe({
        next: (res: any) => {
          this.video = res.data || res;
          this.loading = false;
          // Increment view counter
          if (this.video?._id) {
            this.videoService.streamVideo(this.video._id).subscribe();
          }
        },
        error: (err) => {
          this.error = 'Video not found.';
          this.loading = false;
          console.error(err);
        }
      });

    // Fetch related/trending videos for sidebar
    this.videoService.getTrendingVideos().subscribe({
      next: (res: any) => this.relatedVideos = res.data || [],
      error: () => {}
    });
  }
}
