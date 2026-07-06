import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryPipe],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.css'
})
export class Subscriptions implements OnInit {
  videos: any[] = [];
  loading = true;
  hasSubscriptions = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    
    this.http.get(`${environment.apiUrl}/subscriptions/feed`).subscribe({
      next: (res: any) => {
        this.videos = res?.data || [];
        this.hasSubscriptions = res?.hasSubscriptions !== false && this.videos.length > 0;
        this.loading = false;
      },
      error: (err) => {
        // Just fail gracefully to skeleton/empty state. Toast is handled by interceptor.
        this.loading = false;
        this.hasSubscriptions = false;
      }
    });
  }
}
