import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  toggleSubscription(channelId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${channelId}/toggle`, {}, { withCredentials: true });
  }

  getSubscriptionStatus(channelId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${channelId}/status`, { withCredentials: true });
  }

  getUserSubscriptions(page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-subscriptions?page=${page}&limit=${limit}`, {
      withCredentials: true,
    });
  }

  getSubscriptionFeed(page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/feed?page=${page}&limit=${limit}`, {
      withCredentials: true,
    });
  }

  getChannelSubscribers(channelId: string, page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/${channelId}/subscribers?page=${page}&limit=${limit}`, {
      withCredentials: true,
    });
  }
}
