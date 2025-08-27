import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [CommonModule, RouterModule],
  templateUrl: './main.html',
  styleUrl: './main.css'
})

export class Main implements OnInit {
  videos: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
