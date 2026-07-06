import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
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
  searchQuery = '';

  constructor(
    private videoService: VideoService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Reacts to the `q` query param so searching again from the navbar while
    // already on /explore re-runs the search instead of doing nothing.
    // Previously this page ignored query params entirely and always just
    // re-displayed trending videos, regardless of what was searched.
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.searchQuery = params.get('q') || '';
          this.loading = true;
          this.error = '';

          return this.searchQuery
            ? this.videoService.searchVideos(this.searchQuery)
            : this.videoService.getTrendingVideos();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.videos = res?.data || res?.videos || [];
          this.loading = false;
        },
        error: () => {
          this.error = this.searchQuery
            ? 'Failed to search videos.'
            : 'Failed to load explore feed.';
          this.loading = false;
          // Toast is automatically shown by error interceptor
        }
      });
  }
}
