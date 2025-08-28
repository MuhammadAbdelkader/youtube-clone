import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { VideoService, Video } from '../../video.service';
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
  video: Video | null = null;
  videos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private http: HttpClient
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

    const token = localStorage.getItem('accessToken');

    const headers = new HttpHeaders({
      token: token || ''
    });

    this.http.get<any>('http://localhost:3000/videos', { headers }).subscribe({
      next: (res) => {
        console.log('API Response:', res);
        this.videos = res.data || res;
      },
      error: (err) => console.error(err)
    });
  }
}
