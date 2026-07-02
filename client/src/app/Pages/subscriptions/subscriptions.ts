import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CloudinaryPipe } from '../../pipes/cloudinary.pipe';

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
    // In a real scenario, this would call a SubscriptionService or VideoService method
    this.http.get('http://localhost:3000/api/subscriptions/feed').subscribe({
      next: (res: any) => {
        this.videos = res?.data || res?.videos || [];
        this.hasSubscriptions = res?.hasSubscriptions !== false && this.videos.length > 0;
        
        // If the backend returned an empty array but the user actually has no subscriptions:
        if (this.videos.length === 0) {
          this.hasSubscriptions = false;
        }

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
