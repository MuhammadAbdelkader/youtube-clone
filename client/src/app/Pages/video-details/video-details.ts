import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoService, Video } from '../../video.service';
import { Main } from "../main/main";
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-video-details',
  imports: [Main],
  templateUrl: './video-details.html',
  styleUrl: './video-details.css'
})
export class VideoDetails {
  video: Video | null = null;

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id');
          return id ? this.videoService.getVideoById(id) : [];
        })
      )
      .subscribe({
        next: (data) => this.video = data,
        error: (err) => console.error('Error fetching video:', err)
      });
  }
}
